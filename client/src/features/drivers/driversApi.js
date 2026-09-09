import { apiSlice } from '../../app/apiSlice'

export const driversApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDrivers: builder.query({
      query: (params) => ({ url: '/drivers', params }),
      providesTags: ['Drivers'],
    }),
    getDriver: builder.query({
      query: (id) => `/drivers/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Drivers', id }],
    }),
    createDriver: builder.mutation({
      query: (body) => ({ url: '/drivers', method: 'POST', body }),
      invalidatesTags: ['Drivers'],
    }),
    updateDriver: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/drivers/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => ['Drivers', { type: 'Drivers', id }],
    }),
    addDriverDocument: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/drivers/${id}/documents`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Drivers', id }],
    }),
    deleteDriverDocument: builder.mutation({
      query: ({ id, docId }) => ({ url: `/drivers/${id}/documents/${docId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Drivers', id }],
    }),
  }),
})

export const {
  useGetDriversQuery,
  useGetDriverQuery,
  useCreateDriverMutation,
  useUpdateDriverMutation,
  useAddDriverDocumentMutation,
  useDeleteDriverDocumentMutation,
} = driversApi
