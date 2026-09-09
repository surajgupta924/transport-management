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
  }),
})

export const { useGetPodsQuery, useGetPodQuery, useCreatePodMutation, useUpdatePodMutation } = podApi
