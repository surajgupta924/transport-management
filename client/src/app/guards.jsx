import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect } from 'react'
import {
  selectAuthBootstrapped,
  selectIsAuthenticated,
  selectCurrentUser,
  setBootstrapped,
  setCredentials,
  logout,
} from '../features/auth/authSlice'
import { useLazyGetMeQuery } from '../features/auth/authApi'
import { tokenStorage } from '../lib/tokenStorage'
import { usePermission } from '../hooks/usePermission'
import { Skeleton } from '../components/common/EmptyState'
import { getPortalHome } from '../lib/portal'

export function AuthBootstrap({ children }) {
  const dispatch = useDispatch()
  const bootstrapped = useSelector(selectAuthBootstrapped)
  const [fetchMe] = useLazyGetMeQuery()

  useEffect(() => {
    let cancelled = false
    async function boot() {
      const access = tokenStorage.getAccess()
      if (!access) {
        dispatch(setBootstrapped(true))
        return
      }
      try {
        const result = await Promise.race([
          fetchMe().unwrap(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('bootstrap-timeout')), 6000)),
        ])
        if (!cancelled) {
          dispatch(
            setCredentials({
              user: result.data.user,
              permissions: result.data.permissions,
              accessToken: tokenStorage.getAccess(),
              refreshToken: tokenStorage.getRefresh(),
            })
          )
        }
      } catch {
        if (!cancelled) dispatch(logout())
      } finally {
        if (!cancelled) dispatch(setBootstrapped(true))
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [dispatch, fetchMe])

  if (!bootstrapped) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-ink-50">
        <div className="w-full max-w-sm space-y-3 p-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  return children
}

export function RequireAuth() {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectCurrentUser)
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (user?.portalType === 'DRIVER' && location.pathname.startsWith('/app')) {
    return <Navigate to="/driver" replace />
  }
  if (user?.portalType === 'CUSTOMER' && location.pathname.startsWith('/app')) {
    return <Navigate to="/portal" replace />
  }
  return <Outlet />
}

export function GuestOnly() {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectCurrentUser)
  if (isAuthenticated) return <Navigate to={getPortalHome(user)} replace />
  return <Outlet />
}

export function RequirePermission({ permission, any }) {
  const { can, canAny } = usePermission()
  const allowed = any ? canAny(...(Array.isArray(any) ? any : [any])) : can(permission)
  if (!allowed) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        You do not have permission to view this page.
      </div>
    )
  }
  return <Outlet />
}

export function RequirePortal({ portal, portals }) {
  const user = useSelector(selectCurrentUser)
  const allowed = portals || (portal ? [portal] : [])
  const type = user?.portalType || 'STAFF'
  if (!allowed.includes(type)) {
    return <Navigate to={getPortalHome(user)} replace />
  }
  return <Outlet />
}
