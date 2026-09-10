import { apiSlice } from '../../app/apiSlice'

export const invoicesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query({
      query: (params) => ({ url: '/invoices', params }),
      providesTags: ['Invoices'],
    }),
    getInvoiceSummary: builder.query({
      query: () => '/invoices/summary',
      providesTags: ['Invoices'],
    }),
    getInvoiceDesigner: builder.query({
      query: () => '/invoices/designer',
      providesTags: ['Invoices'],
    }),
    saveInvoiceDesigner: builder.mutation({
      query: (body) => ({ url: '/invoices/designer', method: 'PUT', body }),
      invalidatesTags: ['Invoices'],
    }),
    getInvoice: builder.query({
      query: (id) => `/invoices/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Invoices', id }],
    }),
    createInvoice: builder.mutation({
      query: (body) => ({ url: '/invoices', method: 'POST', body }),
      invalidatesTags: ['Invoices', 'Ledger', 'Dashboard'],
    }),
    issueInvoice: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/invoices/${id}/issue`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => ['Invoices', { type: 'Invoices', id }, 'Ledger'],
    }),
    updateInvoice: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/invoices/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => ['Invoices', { type: 'Invoices', id }],
    }),
  }),
})

export const {
  useGetInvoicesQuery,
  useGetInvoiceSummaryQuery,
  useGetInvoiceDesignerQuery,
  useSaveInvoiceDesignerMutation,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useIssueInvoiceMutation,
} = invoicesApi
