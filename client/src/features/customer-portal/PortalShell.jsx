import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  LayoutDashboard,
  ClipboardList,
  Radio,
  FileText,
  LifeBuoy,
  LogOut,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { logout, selectCurrentUser } from '../auth/authSlice'
import { useLogoutMutation } from '../auth/authApi'
import { tokenStorage } from '../../lib/tokenStorage'
import { disconnectSocket } from '../../lib/socket'

const tabs = [
  { to: '/portal', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/portal/bookings', label: 'Bookings', icon: ClipboardList },
  { to: '/portal/track', label: 'Track', icon: Radio },
  { to: '/portal/invoices', label: 'Invoices', icon: FileText },
  { to: '/portal/support', label: 'Support', icon: LifeBuoy },
]

export function PortalShell() {
  const user = useSelector(selectCurrentUser)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [logoutApi] = useLogoutMutation()

  const handleLogout = async () => {
    try {
      await logoutApi({ refreshToken: tokenStorage.getRefresh() }).unwrap()
    } catch {
      // ignore
    }
    disconnectSocket()
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col bg-[linear-gradient(180deg,#fff8eb_0%,#f8fafc_28%,#f1f5f9_100%)]">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink-200/80 bg-white/90 px-4 py-3 backdrop-blur">
        <div>
          <p className="font-display text-sm font-semibold text-ink-900">Customer portal</p>
          <p className="text-xs text-ink-500">{user?.name}</p>
        </div>
        <button type="button" onClick={handleLogout} className="rounded-md p-2 text-ink-500 hover:bg-ink-100">
          <LogOut className="h-5 w-5" />
        </button>
      </header>
      <main className="page-enter flex-1 overflow-y-auto px-4 py-4 pb-24">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-200 bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-1 py-2 text-[10px] font-medium',
                  isActive ? 'text-brand-700' : 'text-ink-400'
                )
              }
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
