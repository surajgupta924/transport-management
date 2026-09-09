import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ClipboardList, FileText, Home, LifeBuoy, LogOut } from 'lucide-react'
import { cn } from '../../lib/utils'
import { logout, selectCurrentUser } from '../auth/authSlice'
import { useLogoutMutation } from '../auth/authApi'
import { tokenStorage } from '../../lib/tokenStorage'

const tabs = [
  { to: '/portal', label: 'Home', icon: Home, end: true },
  { to: '/portal/bookings', label: 'Bookings', icon: ClipboardList },
  { to: '/portal/invoices', label: 'Invoices', icon: FileText },
  { to: '/portal/support', label: 'Support', icon: LifeBuoy },
]

export function CustomerPortalShell() {
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
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="min-h-svh bg-ink-50">
      <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div>
            <p className="font-display text-sm font-semibold text-ink-900">SwiftHaul customer</p>
            <p className="text-xs text-ink-500">{user?.name}</p>
          </div>
          <button type="button" onClick={handleLogout} className="rounded-md p-2 text-ink-500 hover:bg-ink-100">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 px-2 pb-2">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
                  isActive ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100'
                )
              }
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="page-enter mx-auto max-w-5xl p-4">
        <Outlet />
      </main>
    </div>
  )
}
