import { apiSlice } from '../../app/apiSlice'

export const vehiclesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getVehicles: builder.query({
      query: (params) => ({ url: '/vehicles', params }),
      providesTags: ['Vehicles'],
    }),
    getVehicle: builder.query({
      query: (id) => `/vehicles/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Vehicles', id }],
    }),
    createVehicle: builder.mutation({
      query: (body) => ({ url: '/vehicles', method: 'POST', body }),
      invalidatesTags: ['Vehicles'],
    }),
    updateVehicle: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/vehicles/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => ['Vehicles', { type: 'Vehicles', id }],
    }),
    addVehicleDocument: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/vehicles/${id}/documents`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Vehicles', id }],
    }),
    deleteVehicleDocument: builder.mutation({
      query: ({ id, docId }) => ({ url: `/vehicles/${id}/documents/${docId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Vehicles', id }],
    }),
  }),
})

export const {
  useGetVehiclesQuery,
  useGetVehicleQuery,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useAddVehicleDocumentMutation,
  useDeleteVehicleDocumentMutation,
} = vehiclesApi
