import { apiSlice } from '../../app/apiSlice'

export const loadingStaffApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLoadingStaff: builder.query({
      query: (params) => ({ url: '/loading-staff', params }),
      providesTags: ['LoadingStaff'],
    }),
    createLoadingStaff: builder.mutation({
      query: (body) => ({ url: '/loading-staff', method: 'POST', body }),
      invalidatesTags: ['LoadingStaff'],
    }),
    updateLoadingStaff: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/loading-staff/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['LoadingStaff'],
    }),
  }),
})

export const {
  useGetLoadingStaffQuery,
  useCreateLoadingStaffMutation,
  useUpdateLoadingStaffMutation,
} = loadingStaffApi
