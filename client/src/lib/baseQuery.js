import { fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { tokenStorage } from './tokenStorage'
import { logout, setCredentials } from '../features/auth/authSlice'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || '/api/v1',
  prepareHeaders: (headers) => {
    const token = tokenStorage.getAccess()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  },
})

export const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions)

  if (result.error && result.error.status === 401) {
    const refreshToken = tokenStorage.getRefresh()
    if (!refreshToken) {
      api.dispatch(logout())
      return result
    }

    const refreshResult = await rawBaseQuery(
      {
        url: '/auth/refresh',
        method: 'POST',
        body: { refreshToken },
      },
      api,
      extraOptions
    )

    if (refreshResult.data?.data) {
      const { accessToken, refreshToken: newRefresh, user, permissions } = refreshResult.data.data
      tokenStorage.set(accessToken, newRefresh)
      api.dispatch(setCredentials({ user, permissions, accessToken, refreshToken: newRefresh }))
      result = await rawBaseQuery(args, api, extraOptions)
    } else {
      api.dispatch(logout())
    }
  }

  return result
}
