export function getPortalHome(user) {
  switch (user?.portalType) {
    case 'DRIVER':
      return '/driver'
    case 'CUSTOMER':
      return '/portal'
    default:
      return '/app/dashboard'
  }
}
