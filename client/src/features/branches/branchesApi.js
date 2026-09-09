import { apiSlice } from '../../app/apiSlice'

export const branchesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBranches: builder.query({
      query: (params) => ({ url: '/branches', params }),
      providesTags: ['Branches'],
    }),
    createBranch: builder.mutation({
      query: (body) => ({ url: '/branches', method: 'POST', body }),
      invalidatesTags: ['Branches'],
    }),
    updateBranch: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/branches/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Branches'],
    }),
  }),
})

export const { useGetBranchesQuery, useCreateBranchMutation, useUpdateBranchMutation } = branchesApi
