import { Payment } from './payment.model.js';
import { Invoice } from '../invoices/invoice.model.js';
import { CustomerLedger } from '../ledger/ledger.model.js';
import { applyPaymentToInvoice, recalcCustomerBalance } from '../invoices/invoice.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';
import { writeAuditLog } from '../audit/audit.service.js';

export async function listPayments(query, actor) {
  const { page, limit, skip, sort } = parsePagination(query);
  const filter = {};
  if (query.invoiceId) filter.invoice = query.invoiceId;
  if (query.customerId) filter.customer = query.customerId;
  if (actor?.portalType === 'CUSTOMER') {
    const customerId = actor.linkedCustomer?._id || actor.linkedCustomer;
    if (customerId) filter.customer = customerId;
    else filter._id = { $exists: false };
  }
  if (query.method) filter.method = query.method;
  if (query.from || query.to) {
    filter.paidAt = {};
    if (query.from) filter.paidAt.$gte = new Date(query.from);
    if (query.to) filter.paidAt.$lte = new Date(query.to);
  }

  const [items, total] = await Promise.all([
    Payment.find(filter)
      .populate('invoice', 'invoiceNumber total amountDue status')
      .populate('customer', 'name company')
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(filter),
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function getPaymentById(id) {
  const payment = await Payment.findById(id)
    .populate('invoice', 'invoiceNumber total amountDue status')
    .populate('customer', 'name company')
    .populate('createdBy', 'name email');
  if (!payment) throw new ApiError(404, 'Payment not found');
  return payment;
}

export async function createPayment(payload, actor, req) {
  const invoice = await Invoice.findById(payload.invoiceId);
  if (!invoice) throw new ApiError(400, 'Invalid invoice');
  if (!['ISSUED', 'PARTIAL', 'OVERDUE'].includes(invoice.status)) {
    throw new ApiError(400, `Cannot record payment for invoice in ${invoice.status} status`);
  }
  if (payload.amount > invoice.amountDue + 0.001) {
    throw new ApiError(400, 'Payment amount exceeds amount due');
  }

  const payment = await Payment.create({
    invoice: invoice._id,
    customer: invoice.customer,
    amount: payload.amount,
    method: payload.method,
    reference: payload.reference,
    paidAt: payload.paidAt || new Date(),
    notes: payload.notes || '',
    status: 'APPROVED',
    createdBy: actor._id,
  });

  await applyPaymentToInvoice(invoice, payload.amount);

  await CustomerLedger.create({
    customer: invoice.customer,
    type: 'CREDIT',
    amount: payload.amount,
    balanceAfter: 0,
    referenceType: 'PAYMENT',
    referenceId: payment._id,
    description: `Payment for ${invoice.invoiceNumber} via ${payload.method}`,
    date: payment.paidAt,
    createdBy: actor._id,
  });
  await recalcCustomerBalance(invoice.customer);

  await writeAuditLog({
    actor,
    module: 'payments',
    entity: 'Payment',
    entityId: payment._id,
    action: 'CREATE',
    description: `${actor.email} recorded payment of ${payload.amount} for ${invoice.invoiceNumber}`,
    req,
  });
  return getPaymentById(payment._id);
}

export async function getPaymentSummary() {
  const [count, collected, outstandingInvoices, outstanding] = await Promise.all([
    Payment.countDocuments(),
    Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    Invoice.countDocuments({ status: { $in: ['ISSUED', 'PARTIAL', 'OVERDUE'] } }),
    Invoice.aggregate([
      { $match: { status: { $in: ['ISSUED', 'PARTIAL', 'OVERDUE'] } } },
      { $group: { _id: null, total: { $sum: '$amountDue' } } },
    ]),
  ]);
  return {
    totalPayments: count,
    collected: collected[0]?.total || 0,
    outstandingInvoices,
    outstanding: outstanding[0]?.total || 0,
  };
}
