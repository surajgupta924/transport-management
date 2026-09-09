const ACCESS_KEY = 'tms_access_token'
const REFRESH_KEY = 'tms_refresh_token'

export const tokenStorage = {
  getAccess() {
    return localStorage.getItem(ACCESS_KEY)
  },
  getRefresh() {
    return localStorage.getItem(REFRESH_KEY)
  },
  set(access, refresh) {
    localStorage.setItem(ACCESS_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}
