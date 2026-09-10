import { cn } from '../../lib/utils'

export function StatCard({ label, value, icon: Icon, tone = 'slate', active, onClick }) {
  const tones = {
    slate: 'border-ink-100',
    blue: 'border-blue-200 bg-blue-50/60',
    amber: 'border-amber-200 bg-amber-50/70',
    green: 'border-emerald-200 bg-emerald-50/70',
    rose: 'border-rose-200 bg-rose-50/70',
    violet: 'border-violet-200 bg-violet-50/70',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl border bg-white px-4 py-3 text-left shadow-sm transition',
        tones[tone],
        active && 'ring-2 ring-blue-500',
        onClick && 'hover:-translate-y-0.5 hover:shadow-md'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink-900">{value}</p>
        </div>
        {Icon && (
          <span className="rounded-xl bg-white/80 p-2 text-ink-500 shadow-sm">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
    </button>
  )
}

export function Modal({ open, title, description, onClose, children, wide }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div
        className={cn(
          'relative z-10 max-h-[92vh] w-full overflow-hidden rounded-2xl bg-white shadow-2xl',
          wide ? 'max-w-5xl' : 'max-w-3xl'
        )}
      >
        <div className="flex items-start justify-between border-b border-ink-100 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-900">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
          </div>
          <button type="button" className="rounded-md p-1 text-ink-400 hover:bg-ink-50" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="max-h-[calc(92vh-72px)] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}
