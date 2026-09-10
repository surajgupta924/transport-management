import { apiSlice } from '../../app/apiSlice'

export const bookingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBookings: builder.query({
      query: (params) => ({ url: '/bookings', params }),
      providesTags: ['Bookings'],
    }),
    getBookingStats: builder.query({
      query: () => '/bookings/stats',
      providesTags: ['Bookings'],
    }),
    getBooking: builder.query({
      query: (id) => `/bookings/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Bookings', id }],
    }),
    createBooking: builder.mutation({
      query: (body) => ({ url: '/bookings', method: 'POST', body }),
      invalidatesTags: ['Bookings', 'Dashboard'],
    }),
    updateBooking: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/bookings/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => ['Bookings', { type: 'Bookings', id }, 'Dashboard'],
    }),
    updateBookingStatus: builder.mutation({
      query: ({ id, status }) => ({ url: `/bookings/${id}/status`, method: 'POST', body: { status } }),
      invalidatesTags: (_r, _e, { id }) => ['Bookings', { type: 'Bookings', id }, 'Dashboard'],
    }),
    deleteBooking: builder.mutation({
      query: (id) => ({ url: `/bookings/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Bookings', 'Dashboard'],
    }),
  }),
})

export const {
  useGetBookingsQuery,
  useGetBookingStatsQuery,
  useGetBookingQuery,
  useCreateBookingMutation,
  useUpdateBookingMutation,
  useUpdateBookingStatusMutation,
  useDeleteBookingMutation,
  useLazyGetBookingQuery,
} = bookingsApi
