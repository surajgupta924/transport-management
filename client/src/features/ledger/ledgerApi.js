import { apiSlice } from '../../app/apiSlice'

export const ledgerApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLedger: builder.query({
      query: (params) => ({ url: '/ledgers', params }),
      providesTags: ['Ledger'],
    }),
    getCustomerLedger: builder.query({
      query: ({ customerId, ...params }) => ({ url: `/ledgers/customers/${customerId}`, params }),
      providesTags: ['Ledger'],
    }),
  }),
})

export const { useGetLedgerQuery, useGetCustomerLedgerQuery } = ledgerApi
