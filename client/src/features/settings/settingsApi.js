import { apiSlice } from '../../app/apiSlice'

export const settingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPublicSettings: builder.query({
      query: () => '/settings/public',
      providesTags: ['Settings'],
    }),
    getSettings: builder.query({
      query: (params) => ({ url: '/settings', params }),
      providesTags: ['Settings'],
    }),
    updateSettings: builder.mutation({
      query: (body) => ({ url: '/settings/bulk', method: 'PUT', body }),
      invalidatesTags: ['Settings'],
    }),
    updateSetting: builder.mutation({
      query: (body) => ({ url: '/settings', method: 'PUT', body }),
      invalidatesTags: ['Settings'],
    }),
  }),
})

export const {
  useGetPublicSettingsQuery,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useUpdateSettingMutation,
} = settingsApi
