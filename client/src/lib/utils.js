import { clsx } from 'clsx'

export function cn(...inputs) {
  return clsx(inputs)
}

export function getErrorMessage(error, fallback = 'Something went wrong') {
  return error?.data?.message || error?.error || error?.message || fallback
}

export function getFieldErrors(error) {
  const list = error?.data?.errors
  if (!Array.isArray(list)) return {}
  return list.reduce((acc, item) => {
    if (item.field) acc[item.field] = item.message
    return acc
  }, {})
}

export function mediaUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return path.startsWith('/') ? path : `/${path}`
}

export function formatMoney(value, currency = 'INR') {
  const amount = Number(value) || 0
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `₹${amount.toLocaleString('en-IN')}`
  }
}
