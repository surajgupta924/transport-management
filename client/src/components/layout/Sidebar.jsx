import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Shield,
  Truck,
  UserRound,
  ClipboardList,
  MapPinned,
  Radio,
  Fuel,
  Wrench,
  Wallet,
  FileText,
  Receipt,
  BookOpen,
  Bell,
  LifeBuoy,
  Settings,
  Building2,
  FileCheck2,
  Landmark,
  Store,
  ScrollText,
  BarChart3,
  X,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { usePermission } from '../../hooks/usePermission'
import { useBranding } from '../../features/settings/BrandingProvider'

const navGroups = [
  {
    label: 'Overview',
    items: [{ to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard:view' }],
  },
  {
    label: 'Operations',
    items: [
      { to: '/app/customers', label: 'Customers', icon: UserRound, permission: 'customers:view' },
      { to: '/app/bookings', label: 'Bookings', icon: ClipboardList, permission: 'bookings:view' },
      { to: '/app/trips', label: 'Trips', icon: MapPinned, permission: 'trips:view' },
      { to: '/app/tracking', label: 'Tracking', icon: Radio, permission: 'trips:view' },
      { to: '/app/pod', label: 'POD', icon: FileCheck2, permission: 'pod:view' },
    ],
  },
  {
    label: 'Fleet',
    items: [
      { to: '/app/vehicles', label: 'Vehicles', icon: Truck, permission: 'vehicles:view' },
      { to: '/app/drivers', label: 'Drivers', icon: Users, permission: 'drivers:view' },
      { to: '/app/fuel', label: 'Fuel', icon: Fuel, permission: 'fuel:view' },
      { to: '/app/maintenance', label: 'Maintenance', icon: Wrench, permission: 'maintenance:view' },
      { to: '/app/expenses', label: 'Expenses', icon: Wallet, permission: 'expenses:view' },
      { to: '/app/settlements', label: 'Settlements', icon: Landmark, permission: 'expenses:view' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/app/invoices', label: 'Billing', icon: FileText, permission: 'invoices:view' },
      { to: '/app/payments', label: 'Payments', icon: Receipt, permission: 'payments:view' },
      { to: '/app/ledger', label: 'Ledger', icon: BookOpen, permission: 'ledger:view' },
      { to: '/app/vendors', label: 'Vendors', icon: Store, permission: 'vendors:view' },
      { to: '/app/reports', label: 'Reports', icon: BarChart3, permission: 'reports:view' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/app/users', label: 'Users', icon: Users, permission: 'users:view' },
      { to: '/app/roles', label: 'Roles & Access', icon: Shield, permission: 'roles:view' },
      { to: '/app/notifications', label: 'Notifications', icon: Bell, permission: 'notifications:view' },
      { to: '/app/support', label: 'Support', icon: LifeBuoy, permission: 'support:view' },
      { to: '/app/branches', label: 'Branches', icon: Building2, permission: 'branches:view' },
      { to: '/app/audit', label: 'Audit', icon: ScrollText, permission: 'audit:view' },
      { to: '/app/settings', label: 'Settings', icon: Settings, permission: 'settings:view' },
    ],
  },
]

export function Sidebar({ open, onClose }) {
  const { can } = usePermission()
  const branding = useBranding()

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-ink-950/40 transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-ink-800/40 bg-ink-950 text-ink-100 transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.companyName} className="h-9 w-9 rounded-lg object-contain bg-white p-0.5" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 font-display text-sm font-bold text-ink-950">
                {branding.initials}
              </div>
            )}
            <div>
              <p className="font-display text-sm font-semibold tracking-wide text-white">{branding.companyName}</p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-ink-400">{branding.tagline}</p>
            </div>
          </div>
          <button type="button" className="rounded-md p-1 text-ink-400 lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
          {navGroups.map((group) => {
            const items = group.items.filter((item) => can(item.permission))
            if (!items.length) return null
            return (
              <div key={group.label}>
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => onClose?.()}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                          isActive ? 'bg-ink-800 text-white' : 'text-ink-300 hover:bg-ink-900 hover:text-white'
                        )
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0 opacity-80" />
                      <span className="flex-1">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
