import { apiSlice } from '../../app/apiSlice'

export const vendorsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getVendors: builder.query({
      query: (params) => ({ url: '/vendors', params }),
      providesTags: ['Vendors'],
    }),
    createVendor: builder.mutation({
      query: (body) => ({ url: '/vendors', method: 'POST', body }),
      invalidatesTags: ['Vendors'],
    }),
    updateVendor: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/vendors/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Vendors'],
    }),
  }),
})

export const { useGetVendorsQuery, useCreateVendorMutation, useUpdateVendorMutation } = vendorsApi
