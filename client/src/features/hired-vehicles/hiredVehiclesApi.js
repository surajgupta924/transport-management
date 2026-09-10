import { apiSlice } from '../../app/apiSlice'

export const hiredVehiclesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getHiredVehicles: builder.query({
      query: (params) => ({ url: '/hired-vehicles', params }),
      providesTags: ['HiredVehicles'],
    }),
    getHiredDashboard: builder.query({
      query: () => '/hired-vehicles/dashboard',
      providesTags: ['HiredVehicles'],
    }),
    getHiredTrips: builder.query({
      query: (params) => ({ url: '/hired-vehicles/trips', params }),
      providesTags: ['HiredVehicles'],
    }),
    getHiredPayments: builder.query({
      query: (params) => ({ url: '/hired-vehicles/payments', params }),
      providesTags: ['HiredVehicles'],
    }),
    createHiredVehicle: builder.mutation({
      query: (body) => ({ url: '/hired-vehicles', method: 'POST', body }),
      invalidatesTags: ['HiredVehicles'],
    }),
    updateHiredVehicle: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/hired-vehicles/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['HiredVehicles'],
    }),
    deleteHiredVehicle: builder.mutation({
      query: (id) => ({ url: `/hired-vehicles/${id}`, method: 'DELETE' }),
      invalidatesTags: ['HiredVehicles'],
    }),
    createHiredTrip: builder.mutation({
      query: (body) => ({ url: '/hired-vehicles/trips', method: 'POST', body }),
      invalidatesTags: ['HiredVehicles'],
    }),
    createHiredPayment: builder.mutation({
      query: (body) => ({ url: '/hired-vehicles/payments', method: 'POST', body }),
      invalidatesTags: ['HiredVehicles'],
    }),
  }),
})

export const {
  useGetHiredVehiclesQuery,
  useGetHiredDashboardQuery,
  useGetHiredTripsQuery,
  useGetHiredPaymentsQuery,
  useCreateHiredVehicleMutation,
  useUpdateHiredVehicleMutation,
  useDeleteHiredVehicleMutation,
  useCreateHiredTripMutation,
  useCreateHiredPaymentMutation,
} = hiredVehiclesApi
