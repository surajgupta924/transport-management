import { Menu, LogOut, Bell } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { logout, selectCurrentUser } from '../../features/auth/authSlice'
import { useLogoutMutation } from '../../features/auth/authApi'
import { tokenStorage } from '../../lib/tokenStorage'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

export function Topbar({ onMenuClick }) {
  const user = useSelector(selectCurrentUser)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [logoutApi] = useLogoutMutation()

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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink-200 bg-white/90 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-md p-2 text-ink-600 hover:bg-ink-100 lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="text-sm font-medium text-ink-900">Operations Console</p>
          <p className="hidden text-xs text-ink-500 sm:block">Manage fleet, bookings, and finance</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link to="/app/notifications" className="relative rounded-md p-2 text-ink-500 hover:bg-ink-100">
          <Bell className="h-5 w-5" />
        </Link>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-ink-900">{user?.name}</p>
          <div className="flex items-center justify-end gap-1.5">
            <Badge tone="brand">{user?.role?.name || 'User'}</Badge>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  )
}
