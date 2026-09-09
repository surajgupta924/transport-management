import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as invoiceService from './invoice.service.js';

export const listInvoices = asyncHandler(async (req, res) => {
  const result = await invoiceService.listInvoices(req.query, req.user);
  return sendSuccess(res, { message: 'Invoices fetched', data: result.items, meta: result.meta });
});

export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.getInvoiceById(req.params.id);
  return sendSuccess(res, { message: 'Invoice fetched', data: invoice });
});

export const createInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.createInvoice(req.body, req.user, req);
  return sendSuccess(res, { status: 201, message: 'Invoice created', data: invoice });
});

export const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.updateInvoice(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'Invoice updated', data: invoice });
});

export const issueInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.issueInvoice(req.params.id, req.body, req.user, req);
  return sendSuccess(res, { message: 'Invoice status updated', data: invoice });
});

export const downloadPdf = asyncHandler(async (req, res) => {
  const buffer = await invoiceService.generateInvoicePdf(req.params.id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${req.params.id}.pdf"`);
  return res.send(buffer);
});
