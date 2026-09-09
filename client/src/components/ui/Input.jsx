import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

export const Input = forwardRef(function Input(
  { label, error, hint, required, className, id, ...props },
  ref
) {
  const inputId = id || props.name
  return (
    <label className="flex w-full flex-col gap-1.5 text-left">
      {label && (
        <span className="text-sm font-medium text-ink-700">
          {label}
          {required && <span className="ml-0.5 text-danger-500">*</span>}
        </span>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors',
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
