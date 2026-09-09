import { apiSlice } from '../../app/apiSlice'

export const tripsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTrips: builder.query({
      query: (params) => ({ url: '/trips', params }),
      providesTags: ['Trips'],
    }),
    getTrip: builder.query({
      query: (id) => `/trips/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Trips', id }],
    }),
    createTrip: builder.mutation({
      query: (body) => ({ url: '/trips', method: 'POST', body }),
      invalidatesTags: ['Trips', 'Dashboard'],
    }),
    assignTrip: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/trips/${id}/assign`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => ['Trips', { type: 'Trips', id }, 'Dashboard'],
    }),
    updateTripStatus: builder.mutation({
      query: ({ id, status, ...rest }) => ({
        url: `/trips/${id}/status`,
        method: 'POST',
        body: { status, ...rest },
      }),
      invalidatesTags: (_r, _e, { id }) => ['Trips', { type: 'Trips', id }, 'Dashboard'],
    }),
    getTripTrack: builder.query({
      query: (id) => `/trips/${id}/track`,
      providesTags: (_r, _e, id) => [{ type: 'Trips', id }],
    }),
    postTripLocation: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/trips/${id}/location`, method: 'POST', body }),
    }),
    setTripSharing: builder.mutation({
      query: ({ id, sharing }) => ({ url: `/trips/${id}/sharing`, method: 'POST', body: { sharing } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Trips', id }, 'Trips'],
    }),
  }),
})

export const {
  useGetTripsQuery,
  useGetTripQuery,
  useCreateTripMutation,
  useAssignTripMutation,
  useUpdateTripStatusMutation,
  useGetTripTrackQuery,
  usePostTripLocationMutation,
  useSetTripSharingMutation,
} = tripsApi
