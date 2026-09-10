import { Menu, LogOut, Bell, Search } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { logout, selectCurrentUser } from '../../features/auth/authSlice'
import { useLogoutMutation } from '../../features/auth/authApi'
import { useGetNotificationsQuery } from '../../features/notifications/notificationsApi'
import { tokenStorage } from '../../lib/tokenStorage'
import { Button } from '../ui/Button'

export function Topbar({ onMenuClick }) {
  const user = useSelector(selectCurrentUser)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [logoutApi] = useLogoutMutation()
  const { data } = useGetNotificationsQuery({ page: 1, limit: 1, unread: 'true' }, { pollingInterval: 15000 })
  const unread = data?.meta?.unreadCount || 0

  const handleLogout = async () => {
    try {
      await logoutApi({ refreshToken: tokenStorage.getRefresh() }).unwrap()
    } catch {
      // clear local session anyway
    }
    dispatch(logout())
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <button type="button" className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </button>
        <p className="font-display text-base font-semibold text-slate-800">Dashboard</p>
      </div>

      <div className="hidden max-w-md flex-1 items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 md:flex">
        <Search className="mr-2 h-4 w-4" />
        Search shipments, clients, invoices...
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link to="/app/notifications" className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
          {(user?.name || 'AD').slice(0, 2).toUpperCase()}
        </div>
        <Button variant="secondary" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  )
}
