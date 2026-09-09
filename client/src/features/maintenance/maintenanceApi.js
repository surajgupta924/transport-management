import { apiSlice } from '../../app/apiSlice'

export const maintenanceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMaintenanceRecords: builder.query({
      query: (params) => ({ url: '/maintenance', params }),
      providesTags: ['Maintenance'],
    }),
    createMaintenanceRecord: builder.mutation({
      query: (body) => ({ url: '/maintenance', method: 'POST', body }),
      invalidatesTags: ['Maintenance'],
    }),
    updateMaintenanceRecord: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/maintenance/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Maintenance'],
    }),
    approveMaintenanceRecord: builder.mutation({
      query: (id) => ({ url: `/maintenance/${id}/approve`, method: 'POST' }),
      invalidatesTags: ['Maintenance'],
    }),
  }),
})

export const {
  useGetMaintenanceRecordsQuery,
  useCreateMaintenanceRecordMutation,
  useUpdateMaintenanceRecordMutation,
  useApproveMaintenanceRecordMutation,
} = maintenanceApi
