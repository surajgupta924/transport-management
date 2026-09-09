import { apiSlice } from '../../app/apiSlice'

export const auditApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query({
      query: (params) => ({ url: '/audit-logs', params }),
      providesTags: ['AuditLogs'],
    }),
  }),
})

export const { useGetAuditLogsQuery } = auditApi
