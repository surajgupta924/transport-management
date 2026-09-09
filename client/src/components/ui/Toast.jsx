import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { cn } from '../../lib/utils'
import { X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (toast) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, ...toast }])
      setTimeout(() => dismiss(id), toast.duration || 4000)
    },
    [dismiss]
  )

  const value = useMemo(
    () => ({
      success: (message) => push({ message, tone: 'success' }),
      error: (message) => push({ message, tone: 'danger' }),
      info: (message) => push({ message, tone: 'info' }),
    }),
    [push]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-[var(--shadow-elevated)]',
              toast.tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-900',
              toast.tone === 'danger' && 'border-red-200 bg-red-50 text-red-900',
              toast.tone === 'info' && 'border-sky-200 bg-sky-50 text-sky-900'
            )}
          >
            <span>{toast.message}</span>
            <button type="button" onClick={() => dismiss(toast.id)} className="opacity-60 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
