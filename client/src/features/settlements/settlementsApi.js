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
    getSettlementBoard: builder.query({
      query: (params) => ({ url: '/settlements/board', params }),
      providesTags: ['Settlements', 'Expenses', 'Trips'],
    }),
    recordAdvance: builder.mutation({
      query: (body) => ({ url: '/settlements/advance', method: 'POST', body }),
      invalidatesTags: ['Settlements', 'Expenses'],
    }),
    settleTrip: builder.mutation({
      query: (tripId) => ({ url: `/settlements/trip/${tripId}/settle`, method: 'POST' }),
      invalidatesTags: ['Settlements', 'Expenses', 'Trips'],
    }),
  }),
})

export const {
  useGetSettlementsQuery,
  useGetSettlementQuery,
  useGetDriverBalanceQuery,
  useCreateSettlementMutation,
  useSettleSettlementMutation,
  useGetSettlementBoardQuery,
  useRecordAdvanceMutation,
  useSettleTripMutation,
} = settlementsApi
