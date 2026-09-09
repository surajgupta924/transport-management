import { SupportTicket } from './support.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination, buildMeta } from '../../utils/pagination.js';
import { writeAuditLog } from '../audit/audit.service.js';

export async function listTickets(query, actor) {
  const { page, limit, skip, sort, search } = parsePagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.customerId) filter.customer = query.customerId;
  if (query.assigneeId) filter.assignee = query.assigneeId;
  const and = [];
  if (actor?.portalType === 'CUSTOMER' || actor?.portalType === 'DRIVER' || query.mine === 'true' || query.mine === true) {
    const customerId = actor?.linkedCustomer?._id || actor?.linkedCustomer;
    if (actor?.portalType === 'CUSTOMER' && customerId) {
      and.push({ $or: [{ createdBy: actor._id }, { customer: customerId }] });
    } else {
      and.push({ createdBy: actor?._id });
    }
  }
  if (search) {
    and.push({
      $or: [{ subject: new RegExp(search, 'i') }, { description: new RegExp(search, 'i') }],
    });
  }
  if (and.length) filter.$and = and;

  const [items, total] = await Promise.all([
    SupportTicket.find(filter)
      .populate('createdBy', 'name email')
      .populate('assignee', 'name email')
      .populate('customer', 'name company')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    SupportTicket.countDocuments(filter),
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function getTicketById(id) {
  const ticket = await SupportTicket.findById(id)
    .populate('createdBy', 'name email')
    .populate('assignee', 'name email')
    .populate('customer', 'name company')
    .populate('messages.author', 'name email');
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  const obj = ticket.toObject();
  obj.replies = obj.messages || [];
  return obj;
}

export async function createTicket(payload, actor, req) {
  const ticket = await SupportTicket.create({
    subject: payload.subject,
    description: payload.description,
    category: payload.category || 'GENERAL',
    priority: payload.priority || 'MEDIUM',
    createdBy: actor._id,
    customer: payload.customerId || actor.linkedCustomer || undefined,
    messages: [{ author: actor._id, body: payload.description }],
  });

  await writeAuditLog({
    actor,
    module: 'support',
    entity: 'SupportTicket',
    entityId: ticket._id,
    action: 'CREATE',
    description: `${actor.email} created ticket: ${ticket.subject}`,
    req,
  });
  return getTicketById(ticket._id);
}

export async function updateTicket(id, payload, actor, req) {
  const ticket = await SupportTicket.findById(id);
  if (!ticket) throw new ApiError(404, 'Ticket not found');

  if (payload.status !== undefined) {
    ticket.status = payload.status;
    if (['RESOLVED', 'CLOSED'].includes(payload.status)) ticket.resolvedAt = new Date();
  }
  if (payload.priority !== undefined) ticket.priority = payload.priority;
  if (payload.assigneeId !== undefined) ticket.assignee = payload.assigneeId || undefined;
  await ticket.save();

  await writeAuditLog({
    actor,
    module: 'support',
    entity: 'SupportTicket',
    entityId: ticket._id,
    action: 'UPDATE',
    description: `${actor.email} updated ticket ${ticket.subject}`,
    req,
  });
  return getTicketById(ticket._id);
}

export async function addMessage(id, { body }, actor) {
  const ticket = await SupportTicket.findById(id);
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  if (ticket.status === 'CLOSED') throw new ApiError(400, 'Ticket is closed');
  ticket.messages.push({ author: actor._id, body });
  if (ticket.status === 'OPEN') ticket.status = 'IN_PROGRESS';
  await ticket.save();
  return getTicketById(ticket._id);
}
