import { NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard,
  Truck,
  UserRound,
  ClipboardList,
  MapPinned,
  FileText,
  Bell,
  Settings,
  FileCheck2,
  BarChart3,
  X,
  ChevronDown,
  Route,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { usePermission } from '../../hooks/usePermission'
import { useBranding } from '../../features/settings/BrandingProvider'

const groups = [
  {
    key: 'customers',
    label: 'Customers',
    icon: UserRound,
    permission: 'customers:view',
    to: '/app/customers',
  },
  {
    key: 'fleet',
    label: 'Fleet Management',
    icon: Truck,
    items: [
      { to: '/app/vehicles', label: 'Vehicles', permission: 'vehicles:view' },
      { to: '/app/drivers', label: 'Drivers', permission: 'drivers:view' },
      { to: '/app/hired-vehicles', label: 'Hired Vehicles', permission: 'hiredVehicles:view' },
      { to: '/app/loading-staff', label: 'Loading Staff', permission: 'loadingStaff:view' },
      { to: '/app/maintenance', label: 'Maintenance', permission: 'maintenance:view' },
      { to: '/app/gps', label: 'GPS Integration', permission: 'gps:view' },
    ],
  },
  {
    key: 'shipments',
    label: 'Shipments',
    icon: ClipboardList,
    items: [
      { to: '/app/shipments', label: 'All Shipments', permission: 'bookings:view' },
      { to: '/app/shipments?status=PENDING', label: 'Pending', permission: 'bookings:view' },
      { to: '/app/shipments?status=UNASSIGNED', label: 'Unassigned', permission: 'bookings:view' },
      { to: '/app/shipments?status=ASSIGNED', label: 'Assigned', permission: 'bookings:view' },
      { to: '/app/shipments?status=IN_TRANSIT', label: 'In Transit', permission: 'bookings:view' },
      { to: '/app/shipments?status=OUT_FOR_DELIVERY', label: 'Out for Delivery', permission: 'bookings:view' },
      { to: '/app/shipments?status=DELIVERED', label: 'Delivered', permission: 'bookings:view' },
      { to: '/app/shipments?status=COMPLETED', label: 'Completed', permission: 'bookings:view' },
    ],
  },
  {
    key: 'operations',
    label: 'Operations',
    icon: Route,
    items: [
      { to: '/app/assignments', label: 'Assignments', permission: 'trips:view' },
      { to: '/app/active-trips', label: 'Active Trips', permission: 'trips:view' },
      { to: '/app/tracking', label: 'Live Tracking', permission: 'trips:view' },
    ],
  },
  {
    key: 'trips',
    label: 'Trip Management',
    icon: MapPinned,
    items: [{ to: '/app/trips', label: 'All Trips', permission: 'trips:view' }, { to: '/app/trip-expenses', label: 'Trip Expenses', permission: 'expenses:view' }, { to: '/app/trip-settlement', label: 'Trip Settlement', permission: 'expenses:view' }],
  },
  {
    key: 'pod',
    label: 'POD / Deliveries',
    icon: FileCheck2,
    permission: 'pod:view',
    to: '/app/pod',
  },
  {
    key: 'billing',
    label: 'Billing',
    icon: FileText,
    items: [
      { to: '/app/invoices', label: 'Invoices', permission: 'invoices:view' },
      { to: '/app/payments', label: 'Payments', permission: 'payments:view' },
      { to: '/app/invoice-designer', label: 'Invoice Designer', permission: 'invoices:view' },
    ],
  },
  { key: 'reports', label: 'Reports', icon: BarChart3, permission: 'reports:view', to: '/app/reports' },
  { key: 'notifications', label: 'Notifications', icon: Bell, permission: 'notifications:view', to: '/app/notifications' },
  { key: 'settings', label: 'Settings', icon: Settings, permission: 'settings:view', to: '/app/settings' },
]

function pathMatches(pathname, search, to) {
  const [base, query] = to.split('?')
  if (!pathname.startsWith(base)) return false
  if (!query) return !search || base !== '/app/shipments' || !new URLSearchParams(search).get('status')
  const want = new URLSearchParams(query)
  const have = new URLSearchParams(search)
  return [...want.entries()].every(([k, v]) => have.get(k) === v)
}

export function Sidebar({ open, onClose }) {
  const { can } = usePermission()
  const branding = useBranding()
  const location = useLocation()
  const [expanded, setExpanded] = useState({ fleet: true, shipments: true, operations: true, billing: true, trips: true })

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
              <img src={branding.logoUrl} alt={branding.companyName} className="h-9 w-9 rounded-lg object-contain bg-white" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-display text-sm font-bold text-white">
                {branding.initials}
              </div>
            )}
            <div>
              <p className="font-display text-sm font-semibold text-slate-900">{branding.companyName}</p>
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Fleet ops</p>
            </div>
          </div>
          <button type="button" className="rounded-md p-1 text-slate-400 lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6">
          <NavLink
            to="/app/dashboard"
            onClick={() => onClose?.()}
            className={({ isActive }) =>
              cn(
                'mb-2 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium',
                isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
              )
            }
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </NavLink>

          {groups.map((group) => {
            if (group.to) {
              if (!can(group.permission)) return null
              return (
                <NavLink
                  key={group.key}
                  to={group.to}
                  onClick={() => onClose?.()}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2 text-sm',
                      isActive ? 'bg-blue-50 font-medium text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                    )
                  }
                >
                  <group.icon className="h-4 w-4" />
                  {group.label}
                </NavLink>
              )
            }
            const items = (group.items || []).filter((item) => can(item.permission))
            if (!items.length) return null
            const isOpen = expanded[group.key]
            const childActive = items.some((item) => pathMatches(location.pathname, location.search, item.to))
            return (
              <div key={group.key} className="pt-1">
                <button
                  type="button"
                  onClick={() => setExpanded((s) => ({ ...s, [group.key]: !s[group.key] }))}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm',
                    childActive ? 'bg-blue-50 font-medium text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <group.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{group.label}</span>
                  <ChevronDown className={cn('h-4 w-4 transition', isOpen ? 'rotate-0' : '-rotate-90')} />
                </button>
                {isOpen && (
                  <div className="ml-6 mt-0.5 space-y-0.5 border-l border-slate-100 pl-3">
                    {items.map((item) => {
                      const active = pathMatches(location.pathname, location.search, item.to)
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => onClose?.()}
                          className={cn(
                            'block rounded-lg px-2 py-1.5 text-[13px]',
                            active ? 'bg-blue-600 font-medium text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                          )}
                        >
                          {item.label}
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
