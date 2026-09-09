import { apiSlice } from '../../app/apiSlice'

export const supportApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTickets: builder.query({
      query: (params) => ({ url: '/support', params }),
      providesTags: ['Support'],
    }),
    getTicket: builder.query({
      query: (id) => `/support/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Support', id }],
    }),
    createTicket: builder.mutation({
      query: (body) => ({ url: '/support', method: 'POST', body }),
      invalidatesTags: ['Support'],
    }),
    updateTicket: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/support/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => ['Support', { type: 'Support', id }],
    }),
    addTicketReply: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/support/${id}/replies`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Support', id }],
    }),
  }),
})

export const {
  useGetTicketsQuery,
  useGetTicketQuery,
  useCreateTicketMutation,
  useUpdateTicketMutation,
  useAddTicketReplyMutation,
} = supportApi
