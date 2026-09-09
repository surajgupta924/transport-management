import { cn } from '../../lib/utils'

export function Card({ children, className }) {
  return (
    <div className={cn('rounded-xl border border-ink-200/80 bg-white shadow-[var(--shadow-card)]', className)}>
      {children}
    </div>
  )
}

export function CardHeader({ title, description, action, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4', className)}>
      <div>
        <h3 className="font-display text-base font-semibold text-ink-900">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function CardBody({ children, className }) {
  return <div className={cn('p-5', className)}>{children}</div>
}
