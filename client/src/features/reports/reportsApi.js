import { apiSlice } from '../../app/apiSlice'

export const reportsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getReport: builder.query({
      query: ({ type, ...params }) => ({ url: `/reports/${type}`, params }),
      providesTags: ['Reports'],
    }),
    exportReport: builder.mutation({
      query: ({ type, ...params }) => ({
        url: `/reports/${type}/export`,
        method: 'GET',
        params,
        responseHandler: async (response) => {
          const contentType = response.headers.get('content-type') || ''
          if (contentType.includes('application/json')) return response.json()
          const blob = await response.blob()
          return { blob, contentType }
        },
      }),
    }),
  }),
})

export const { useGetReportQuery, useLazyGetReportQuery, useExportReportMutation } = reportsApi
