import { apiSlice } from '../../app/apiSlice'

export const expensesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getExpenses: builder.query({
      query: (params) => ({ url: '/expenses', params }),
      providesTags: ['Expenses'],
    }),
    createExpense: builder.mutation({
      query: (body) => ({ url: '/expenses', method: 'POST', body }),
      invalidatesTags: ['Expenses'],
    }),
    updateExpense: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/expenses/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Expenses'],
    }),
    approveExpense: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/expenses/${id}/approve`, method: 'POST', body }),
      invalidatesTags: ['Expenses'],
    }),
    rejectExpense: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/expenses/${id}/reject`, method: 'POST', body }),
      invalidatesTags: ['Expenses'],
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
