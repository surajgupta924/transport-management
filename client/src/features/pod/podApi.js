import { apiSlice } from '../../app/apiSlice'

export const podApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPods: builder.query({
      query: (params) => ({ url: '/pod', params }),
      providesTags: ['POD'],
    }),
    getPod: builder.query({
      query: (id) => `/pod/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'POD', id }],
    }),
    createPod: builder.mutation({
      query: (body) => ({ url: '/pod', method: 'POST', body }),
      invalidatesTags: ['POD', 'Trips'],
    }),
    updatePod: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/pod/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['POD'],
    }),
    verifyPod: builder.mutation({
      query: ({ id, status, reason }) => ({ url: `/pod/${id}/verify`, method: 'POST', body: { status, reason } }),
      invalidatesTags: ['POD', 'Bookings', 'Trips'],
    }),
  }),
})

export const { useGetPodsQuery, useGetPodQuery, useCreatePodMutation, useUpdatePodMutation, useVerifyPodMutation } = podApi
