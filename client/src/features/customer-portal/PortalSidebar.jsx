import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, Radio, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useBranding } from '../../features/settings/BrandingProvider'

const items = [
  { to: '/portal', label: 'Dashboard', end: true, icon: LayoutDashboard },
  { to: '/portal/create', label: 'Create Shipment', icon: PlusCircle },
  { to: '/portal/track', label: 'Tracking', icon: Radio },
]

export function PortalSidebar({ open, onClose }) {
  const branding = useBranding()
  const location = useLocation()

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-900/30 transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white text-slate-700 shadow-sm transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.companyName} className="h-9 w-9 rounded-lg bg-white object-contain" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-display text-sm font-bold text-white">
                {branding.initials}
              </div>
            )}
            <div>
              <p className="font-display text-sm font-semibold text-slate-900">{branding.companyName}</p>
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Customer</p>
            </div>
          </div>
          <button type="button" className="rounded-md p-1 text-slate-400 lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 pb-6">
          {items.map((item) => {
            const active = item.end
              ? location.pathname === item.to
              : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => onClose?.()}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm',
                  active ? 'bg-blue-50 font-medium text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
