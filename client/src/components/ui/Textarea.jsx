import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, required, className, id, rows = 3, ...props },
  ref
) {
  const areaId = id || props.name
  return (
    <label className="flex w-full flex-col gap-1.5 text-left">
      {label && (
        <span className="text-sm font-medium text-ink-700">
          {label}
          {required && <span className="ml-0.5 text-danger-500">*</span>}
        </span>
      )}
      <textarea
        ref={ref}
        id={areaId}
        rows={rows}
        className={cn(
          'w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400',
          'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100',
          error && 'border-danger-500 focus:border-danger-500 focus:ring-red-100',
          className
        )}
        {...props}
      />
      {error ? (
        <span className="text-xs text-danger-500">{error}</span>
      ) : hint ? (
        <span className="text-xs text-ink-400">{hint}</span>
      ) : null}
    </label>
  )
})
