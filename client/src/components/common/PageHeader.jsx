export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">{eyebrow}</p>}
        <h1 className="font-display text-2xl font-semibold text-ink-900">{title}</h1>
        {description && <p className="text-sm text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}
