const WARNING = new Set([
  'PENDING',
  'ASSIGNED',
  'IN_PROGRESS',
  'PARTIAL',
  'DUE',
  'OPEN',
  'SCHEDULED',
  'DRAFT',
  'UNASSIGNED',
  'OUT_FOR_DELIVERY',
  'POD_UPLOADED',
  'PENDING_APPROVAL',
])
const SUCCESS = new Set([
  'ACTIVE',
  'AVAILABLE',
  'COMPLETED',
  'DELIVERED',
  'PAID',
  'APPROVED',
  'RESOLVED',
  'CLOSED',
  'CONFIRMED',
  'ACCEPTED',
  'VERIFIED',
  'RELEASED',
])
const DANGER = new Set([
  'CANCELLED',
  'REJECTED',
  'OVERDUE',
  'INACTIVE',
  'SUSPENDED',
  'FAILED',
  'EXPIRED',
  'MAINTENANCE',
])
const INFO = new Set(['ONLINE', 'OFFLINE', 'ADMIN', 'IMPORTED', 'STARTED', 'LOADED', 'UNLOADED', 'ON_TRIP', 'IN_TRANSIT'])

export function statusTone(status) {
  const value = String(status || '').toUpperCase()
  if (SUCCESS.has(value)) return 'success'
  if (WARNING.has(value)) return 'warning'
  if (DANGER.has(value)) return 'danger'
  if (INFO.has(value)) return 'info'
  return 'neutral'
}

export function formatLabel(value) {
  if (!value) return '—'
  return String(value).replace(/_/g, ' ')
}
