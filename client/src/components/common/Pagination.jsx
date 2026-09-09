import { Button } from '../ui/Button'

export function Pagination({ meta, onPageChange }) {
  if (!meta) return null
  return (
    <div className="flex items-center justify-between border-t border-ink-100 px-5 py-3 text-sm text-ink-500">
      <span>
        Page {meta.page} of {meta.totalPages || 1} · {meta.total ?? 0} total
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={!meta.hasPrev} onClick={() => onPageChange(meta.page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={!meta.hasNext} onClick={() => onPageChange(meta.page + 1)}>
          Next
        </Button>
      </div>
    </div>
  )
}
