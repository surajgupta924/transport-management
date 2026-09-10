import { apiSlice } from '../../app/apiSlice'

export const expensesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getExpenses: builder.query({
      query: (params) => ({ url: '/expenses', params }),
      providesTags: ['Expenses'],
    }),
    createExpense: builder.mutation({
      query: (body) => ({ url: '/expenses', method: 'POST', body }),
      invalidatesTags: ['Expenses', 'Settlements'],
    }),
    updateExpense: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/expenses/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Expenses', 'Settlements'],
    }),
    approveExpense: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/expenses/${id}/approve`, method: 'POST', body }),
      invalidatesTags: ['Expenses', 'Settlements'],
    }),
    rejectExpense: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/expenses/${id}/reject`, method: 'POST', body }),
      invalidatesTags: ['Expenses', 'Settlements'],
    }),
  }),
})

export const {
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useApproveExpenseMutation,
  useRejectExpenseMutation,
} = expensesApi
