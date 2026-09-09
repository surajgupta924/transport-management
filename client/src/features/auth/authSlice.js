import { createSlice } from '@reduxjs/toolkit'
import { tokenStorage } from '../../lib/tokenStorage'

const initialState = {
  user: null,
  permissions: [],
  accessToken: tokenStorage.getAccess(),
  refreshToken: tokenStorage.getRefresh(),
  bootstrapped: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { user, permissions, accessToken, refreshToken } = action.payload
      state.user = user
      state.permissions = permissions || []
      state.accessToken = accessToken
      state.refreshToken = refreshToken
      state.bootstrapped = true
      if (accessToken && refreshToken) {
        tokenStorage.set(accessToken, refreshToken)
      }
    },
    setBootstrapped(state, action) {
      state.bootstrapped = action.payload
    },
    logout(state) {
      state.user = null
      state.permissions = []
      state.accessToken = null
      state.refreshToken = null
      state.bootstrapped = true
      tokenStorage.clear()
    },
  },
})

export const { setCredentials, setBootstrapped, logout } = authSlice.actions
export default authSlice.reducer

export const selectCurrentUser = (state) => state.auth.user
export const selectPermissions = (state) => state.auth.permissions
export const selectIsAuthenticated = (state) => Boolean(state.auth.accessToken && state.auth.user)
export const selectAuthBootstrapped = (state) => state.auth.bootstrapped
