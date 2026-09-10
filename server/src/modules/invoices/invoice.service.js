import PDFDocument from 'pdfkit';
import { Invoice, computeInvoiceTotals } from './invoice.model.js';
import { Booking } from '../bookings/booking.model.js';
import { Trip } from '../trips/trip.model.js';
import { Customer } from '../customers/customer.model.js';
import { CustomerLedger } from '../ledger/ledger.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';
import { writeAuditLog } from '../audit/audit.service.js';
import { nextInvoiceNumber } from '../../utils/sequence.js';

function normalizeLines(lines = []) {
  return lines.map((l) => ({
    description: l.description || '',
    quantity: l.quantity || 1,
    rate: l.rate || 0,
    amount: l.amount ?? Number(((l.quantity || 1) * (l.rate || 0)).toFixed(2)),
  }));
}

async function linesFromBooking(booking) {
  const c = booking.charges || {};
  const lines = [];
  if (c.freight) lines.push({ description: 'Freight', quantity: 1, rate: c.freight, amount: c.freight });
  if (c.loading) lines.push({ description: 'Loading', quantity: 1, rate: c.loading, amount: c.loading });
  if (c.unloading) lines.push({ description: 'Unloading', quantity: 1, rate: c.unloading, amount: c.unloading });
  if (c.detention) lines.push({ description: 'Detention', quantity: 1, rate: c.detention, amount: c.detention });
  if (c.other) lines.push({ description: 'Other charges', quantity: 1, rate: c.other, amount: c.other });
  if (!lines.length) {
    lines.push({ description: `Booking ${booking.bookingNumber}`, quantity: 1, rate: c.total || 0, amount: c.total || 0 });
  }
  return { lines, taxPercent: c.taxPercent || 0, discount: c.discount || 0 };
}

export async function listInvoices(query, actor) {
  const { page, limit, skip, sort, search } = parsePagination(query);
  const filter = {};
  if (search) filter.invoiceNumber = new RegExp(search, 'i');
  if (query.status) filter.status = query.status;
  if (query.customerId) filter.customer = query.customerId;
  if (actor?.portalType === 'CUSTOMER' || query.mine === 'true' || query.mine === true) {
    const customerId = actor?.linkedCustomer?._id || actor?.linkedCustomer;
    if (customerId) filter.customer = customerId;
    else if (actor?.portalType === 'CUSTOMER') filter._id = { $exists: false };
  }
  if (query.from || query.to) {
    filter.issueDate = {};
    if (query.from) filter.issueDate.$gte = new Date(query.from);
    if (query.to) filter.issueDate.$lte = new Date(query.to);
  }

  const [items, total] = await Promise.all([
    Invoice.find(filter)
      .populate('customer', 'name company email mobile')
      .populate('booking', 'bookingNumber shipmentNumber')
      .populate('trip', 'tripNumber')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Invoice.countDocuments(filter),
  ]);
  const presented = items.map((inv) => {
    const obj = inv.toObject();
    obj.amount = obj.subtotal;
    obj.totalAmount = obj.total;
    obj.paidAmount = obj.amountPaid;
    return obj;
  });
  return { items: presented, meta: buildMeta({ page, limit, total }) };
}

export async function getInvoiceById(id) {
  const invoice = await Invoice.findById(id)
    .populate('customer', 'name company email mobile gstin addresses')
    .populate('booking', 'bookingNumber source charges')
    .populate('trip', 'tripNumber status')
    .populate('createdBy', 'name email');
  if (!invoice) throw new ApiError(404, 'Invoice not found');
  const obj = invoice.toObject();
  obj.amount = obj.subtotal;
  obj.totalAmount = obj.total;
  obj.paidAmount = obj.amountPaid;
  return obj;
}

export async function createInvoice(payload, actor, req) {
  const customer = await Customer.findById(payload.customerId);
  if (!customer) throw new ApiError(400, 'Invalid customer');

  let lines = normalizeLines(payload.lines || []);
  let taxPercent = payload.taxPercent || 0;
  let discount = payload.discount || 0;
  let bookingId = payload.bookingId || undefined;
  let tripId = payload.tripId || undefined;

  if ((!lines.length || payload.amount) && payload.amount) {
    const amount = Number(payload.amount) || 0;
    const taxAmount = Number(payload.taxAmount) || 0;
    lines = [{ description: payload.notes || 'Freight invoice', quantity: 1, rate: amount, amount }];
    if (taxAmount && amount) taxPercent = Number(((taxAmount / amount) * 100).toFixed(2));
  }

  if (payload.fromBooking && payload.bookingId) {
    const booking = await Booking.findById(payload.bookingId);
    if (!booking) throw new ApiError(400, 'Invalid booking');
    const derived = await linesFromBooking(booking);
    lines = derived.lines;
    taxPercent = derived.taxPercent;
    discount = derived.discount;
    bookingId = booking._id;
    if (booking.trip) tripId = booking.trip;
  } else if (payload.tripId) {
    const trip = await Trip.findById(payload.tripId).populate('booking');
    if (!trip) throw new ApiError(400, 'Invalid trip');
    tripId = trip._id;
    bookingId = trip.booking?._id || trip.booking;
    if ((!lines.length || payload.fromBooking) && trip.booking) {
      const booking = typeof trip.booking === 'object' ? trip.booking : await Booking.findById(trip.booking);
      if (booking) {
        const derived = await linesFromBooking(booking);
        lines = derived.lines;
        taxPercent = derived.taxPercent;
        discount = derived.discount;
      }
    }
  }

  const totals = computeInvoiceTotals({ lines, taxPercent, discount });
  const invoice = await Invoice.create({
    invoiceNumber: await nextInvoiceNumber(),
    customer: customer._id,
    booking: bookingId,
    trip: tripId,
    lines,
    taxPercent,
    discount,
    ...totals,
    amountPaid: 0,
    amountDue: totals.total,
    status: payload.status || 'DRAFT',
    issueDate: payload.issueDate || new Date(),
    dueDate: payload.dueDate,
    notes: payload.notes || '',
    createdBy: actor._id,
  });

  await writeAuditLog({
    actor,
    module: 'invoices',
    entity: 'Invoice',
    entityId: invoice._id,
    action: 'CREATE',
    description: `${actor.email} created invoice ${invoice.invoiceNumber}`,
    req,
  });
  return getInvoiceById(invoice._id);
}

export async function updateInvoice(id, payload, actor, req) {
  const invoice = await Invoice.findById(id);
  if (!invoice) throw new ApiError(404, 'Invoice not found');
  if (!['DRAFT'].includes(invoice.status)) {
    throw new ApiError(400, 'Only DRAFT invoices can be edited');
  }

  if (payload.lines) invoice.lines = normalizeLines(payload.lines);
  if (payload.taxPercent !== undefined) invoice.taxPercent = payload.taxPercent;
  if (payload.discount !== undefined) invoice.discount = payload.discount;
  if (payload.notes !== undefined) invoice.notes = payload.notes;
  if (payload.dueDate !== undefined) invoice.dueDate = payload.dueDate;
  if (payload.issueDate !== undefined) invoice.issueDate = payload.issueDate;

  const totals = computeInvoiceTotals({
    lines: invoice.lines,
    taxPercent: invoice.taxPercent,
    discount: invoice.discount,
  });
  Object.assign(invoice, totals);
  invoice.amountDue = totals.total - (invoice.amountPaid || 0);
  await invoice.save();

  await writeAuditLog({
    actor,
    module: 'invoices',
    entity: 'Invoice',
    entityId: invoice._id,
    action: 'UPDATE',
    description: `${actor.email} updated invoice ${invoice.invoiceNumber}`,
    req,
  });
  return getInvoiceById(invoice._id);
}

export async function issueInvoice(id, { status }, actor, req) {
  const invoice = await Invoice.findById(id);
  if (!invoice) throw new ApiError(404, 'Invoice not found');

  if (status === 'CANCELLED') {
    if (invoice.amountPaid > 0) throw new ApiError(400, 'Cannot cancel invoice with payments');
    invoice.status = 'CANCELLED';
  } else {
    if (invoice.status !== 'DRAFT') throw new ApiError(400, 'Only DRAFT invoices can be issued');
    invoice.status = 'ISSUED';
    invoice.issueDate = invoice.issueDate || new Date();

    await CustomerLedger.create({
      customer: invoice.customer,
      type: 'DEBIT',
      amount: invoice.total,
      balanceAfter: 0, // recalculated below
      referenceType: 'INVOICE',
      referenceId: invoice._id,
      description: `Invoice ${invoice.invoiceNumber}`,
      date: invoice.issueDate,
      createdBy: actor._id,
    });
    await recalcCustomerBalance(invoice.customer);
  }
  await invoice.save();

  await writeAuditLog({
    actor,
    module: 'invoices',
    entity: 'Invoice',
    entityId: invoice._id,
    action: status,
    description: `${actor.email} set invoice ${invoice.invoiceNumber} to ${status}`,
    req,
  });
  return getInvoiceById(invoice._id);
}

export async function recalcCustomerBalance(customerId) {
  const entries = await CustomerLedger.find({ customer: customerId }).sort({ date: 1, createdAt: 1 });
  let balance = 0;
  for (const entry of entries) {
    balance += entry.type === 'DEBIT' ? entry.amount : -entry.amount;
    entry.balanceAfter = Number(balance.toFixed(2));
    await entry.save();
  }
  await Customer.findByIdAndUpdate(customerId, { outstandingBalance: balance });
  return balance;
}

export async function generateInvoicePdf(id) {
  const invoice = await getInvoiceById(id);
  const doc = new PDFDocument({ margin: 50 });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));

  const done = new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

  doc.fontSize(18).text('TAX INVOICE', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Invoice #: ${invoice.invoiceNumber}`);
  doc.text(`Status: ${invoice.status}`);
  doc.text(`Issue Date: ${invoice.issueDate ? new Date(invoice.issueDate).toISOString().slice(0, 10) : '-'}`);
  doc.text(`Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toISOString().slice(0, 10) : '-'}`);
  doc.moveDown();
  doc.text(`Bill To: ${invoice.customer?.name || ''}`);
  if (invoice.customer?.company) doc.text(invoice.customer.company);
  if (invoice.customer?.email) doc.text(invoice.customer.email);
  if (invoice.customer?.gstin) doc.text(`GSTIN: ${invoice.customer.gstin}`);
  doc.moveDown();
  doc.text('Line Items:');
  for (const line of invoice.lines || []) {
    doc.text(`- ${line.description || 'Item'}: ${line.quantity} x ${line.rate} = ${line.amount}`);
  }
  doc.moveDown();
  doc.text(`Subtotal: ${invoice.subtotal}`);
  doc.text(`Discount: ${invoice.discount}`);
  doc.text(`Tax (${invoice.taxPercent}%): ${invoice.taxAmount}`);
  doc.fontSize(14).text(`Total: ${invoice.total}`);
  doc.fontSize(12).text(`Paid: ${invoice.amountPaid} | Due: ${invoice.amountDue}`);
  if (invoice.notes) {
    doc.moveDown();
    doc.text(`Notes: ${invoice.notes}`);
  }
  doc.end();
  return done;
}

export async function applyPaymentToInvoice(invoice, amount) {
  invoice.amountPaid = Number(((invoice.amountPaid || 0) + amount).toFixed(2));
  invoice.amountDue = Number((invoice.total - invoice.amountPaid).toFixed(2));
  if (invoice.amountDue <= 0) {
    invoice.status = 'PAID';
    invoice.amountDue = 0;
  } else if (invoice.amountPaid > 0) {
    invoice.status = 'PARTIAL';
  }
  await invoice.save();
  return invoice;
}

const DESIGNER_KEYS = {
  templateName: 'invoice.templateName',
  style: 'invoice.style',
  primaryColor: 'invoice.primaryColor',
  headerColor: 'invoice.headerColor',
  font: 'invoice.font',
  headerAlign: 'invoice.headerAlign',
  logoSize: 'invoice.logoSize',
  showLogo: 'invoice.showLogo',
  showAddress: 'invoice.showAddress',
  showContact: 'invoice.showContact',
  showGst: 'invoice.showGst',
  showCustomerId: 'invoice.showCustomerId',
  showTracking: 'invoice.showTracking',
  showBookingDate: 'invoice.showBookingDate',
  showDueDate: 'invoice.showDueDate',
  published: 'invoice.published',
};

export async function getInvoiceSummary() {
  const [total, issued, paid, amount] = await Promise.all([
    Invoice.countDocuments(),
    Invoice.countDocuments({ status: 'ISSUED' }),
    Invoice.countDocuments({ status: 'PAID' }),
    Invoice.aggregate([
      { $match: { status: { $ne: 'CANCELLED' } } },
      { $group: { _id: null, total: { $sum: '$total' }, collected: { $sum: '$amountPaid' } } },
    ]),
  ]);
  return {
    totalInvoices: total,
    issued,
    paid,
    totalAmount: amount[0]?.total || 0,
    collected: amount[0]?.collected || 0,
  };
}

export async function getDesigner() {
  const { Setting } = await import('../settings/setting.model.js');
  const items = await Setting.find({ key: { $in: Object.values(DESIGNER_KEYS) } });
  const map = Object.fromEntries(items.map((s) => [s.key, s.value]));
  return {
    templateName: map[DESIGNER_KEYS.templateName] || 'Default Invoice',
    style: map[DESIGNER_KEYS.style] || 'modern',
    primaryColor: map[DESIGNER_KEYS.primaryColor] || '#2563eb',
    headerColor: map[DESIGNER_KEYS.headerColor] || '#0f172a',
    font: map[DESIGNER_KEYS.font] || 'Inter',
    headerAlign: map[DESIGNER_KEYS.headerAlign] || 'left',
    logoSize: map[DESIGNER_KEYS.logoSize] || 'medium',
    showLogo: map[DESIGNER_KEYS.showLogo] !== false,
    showAddress: map[DESIGNER_KEYS.showAddress] !== false,
    showContact: map[DESIGNER_KEYS.showContact] !== false,
    showGst: map[DESIGNER_KEYS.showGst] !== false,
    showCustomerId: map[DESIGNER_KEYS.showCustomerId] !== false,
    showTracking: map[DESIGNER_KEYS.showTracking] !== false,
    showBookingDate: map[DESIGNER_KEYS.showBookingDate] !== false,
    showDueDate: map[DESIGNER_KEYS.showDueDate] !== false,
    published: map[DESIGNER_KEYS.published] === true,
  };
}

export async function saveDesigner(payload, actor, req) {
  const { upsertSetting } = await import('../settings/setting.service.js');
  const current = await getDesigner();
  const next = { ...current, ...payload };
  for (const [field, key] of Object.entries(DESIGNER_KEYS)) {
    await upsertSetting(
      { key, value: next[field], group: 'invoice', description: `Invoice designer ${field}` },
      actor,
      req
    );
  }
  return getDesigner();
}
