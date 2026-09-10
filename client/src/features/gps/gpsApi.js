import { apiSlice } from '../../app/apiSlice'

export const gpsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGpsSetup: builder.query({
      query: () => '/gps/setup',
      providesTags: ['Gps'],
    }),
    saveGpsSetup: builder.mutation({
      query: (body) => ({ url: '/gps/setup', method: 'PUT', body }),
      invalidatesTags: ['Gps'],
    }),
    generateGpsToken: builder.mutation({
      query: () => ({ url: '/gps/token', method: 'POST' }),
      invalidatesTags: ['Gps'],
    }),
  }),
})

export const { useGetGpsSetupQuery, useSaveGpsSetupMutation, useGenerateGpsTokenMutation } = gpsApi
