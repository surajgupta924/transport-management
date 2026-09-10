import { useSelector } from 'react-redux'
import { selectPermissions, selectCurrentUser } from '../features/auth/authSlice'

export function usePermission() {
  const permissions = useSelector(selectPermissions)
  const user = useSelector(selectCurrentUser)
  const isSuperAdmin = user?.role?.slug === 'super-admin' || user?.role?.slug === 'admin'

  const can = (...codes) => {
    if (isSuperAdmin) return true
    return codes.every((code) => permissions.includes(code))
  }

  const canAny = (...codes) => {
    if (isSuperAdmin) return true
    return codes.some((code) => permissions.includes(code))
  }

  return { can, canAny, permissions, isSuperAdmin }
}

export function Can({ permission, any, children, fallback = null }) {
  const { can, canAny } = usePermission()
  const allowed = any ? canAny(...(Array.isArray(any) ? any : [any])) : can(permission)
  return allowed ? children : fallback
}
