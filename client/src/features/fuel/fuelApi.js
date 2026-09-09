import { apiSlice } from '../../app/apiSlice'

export const fuelApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFuelRecords: builder.query({
      query: (params) => ({ url: '/fuel', params }),
      providesTags: ['Fuel'],
    }),
    createFuelRecord: builder.mutation({
      query: (body) => ({ url: '/fuel', method: 'POST', body }),
      invalidatesTags: ['Fuel'],
    }),
    updateFuelRecord: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/fuel/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Fuel'],
    }),
    approveFuelRecord: builder.mutation({
      query: (id) => ({ url: `/fuel/${id}/approve`, method: 'POST' }),
      invalidatesTags: ['Fuel'],
    }),
  }),
})

export const {
  useGetFuelRecordsQuery,
  useCreateFuelRecordMutation,
  useUpdateFuelRecordMutation,
  useApproveFuelRecordMutation,
} = fuelApi
