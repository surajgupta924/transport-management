import { apiSlice } from '../../app/apiSlice'

export const settlementsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSettlements: builder.query({
      query: (params) => ({ url: '/settlements', params }),
      providesTags: ['Settlements'],
    }),
    getSettlement: builder.query({
      query: (id) => `/settlements/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Settlements', id }],
    }),
    getDriverBalance: builder.query({
      query: (driverId) => `/settlements/driver/${driverId}/balance`,
    }),
    createSettlement: builder.mutation({
      query: (body) => ({ url: '/settlements', method: 'POST', body }),
      invalidatesTags: ['Settlements', 'Expenses'],
    }),
    settleSettlement: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/settlements/${id}/settle`, method: 'POST', body }),
      invalidatesTags: ['Settlements', 'Expenses'],
    }),
  }),
})

export const {
  useGetSettlementsQuery,
  useGetSettlementQuery,
  useGetDriverBalanceQuery,
  useCreateSettlementMutation,
  useSettleSettlementMutation,
} = settlementsApi
