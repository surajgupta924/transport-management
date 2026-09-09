import { apiSlice } from '../../app/apiSlice'

export const paymentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPayments: builder.query({
      query: (params) => ({ url: '/payments', params }),
      providesTags: ['Payments'],
    }),
    createPayment: builder.mutation({
      query: (body) => ({ url: '/payments', method: 'POST', body }),
      invalidatesTags: ['Payments', 'Invoices', 'Ledger', 'Dashboard'],
    }),
  }),
})

export const { useGetPaymentsQuery, useCreatePaymentMutation } = paymentsApi
