import { apiSlice } from '../../app/apiSlice'

export const customersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query({
      query: (params) => ({ url: '/customers', params }),
      providesTags: ['Customers'],
    }),
    getCustomer: builder.query({
      query: (id) => `/customers/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Customers', id }],
    }),
    createCustomer: builder.mutation({
      query: (body) => ({ url: '/customers', method: 'POST', body }),
      invalidatesTags: ['Customers'],
    }),
    updateCustomer: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/customers/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => ['Customers', { type: 'Customers', id }],
    }),
    addCustomerNote: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/customers/${id}/notes`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Customers', id }],
    }),
    updateCustomerTags: builder.mutation({
      query: ({ id, tags }) => ({ url: `/customers/${id}/tags`, method: 'PUT', body: { tags } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Customers', id }, 'Customers'],
    }),
  }),
})

export const {
  useGetCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useAddCustomerNoteMutation,
  useUpdateCustomerTagsMutation,
} = customersApi
