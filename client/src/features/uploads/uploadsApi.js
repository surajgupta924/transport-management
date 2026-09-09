import { apiSlice } from '../../app/apiSlice'

export const uploadsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    uploadFiles: builder.mutation({
      query: ({ files, folder = 'general' }) => {
        const formData = new FormData()
        const list = Array.isArray(files) ? files : [files]
        list.filter(Boolean).forEach((file) => formData.append('files', file))
        return {
          url: `/uploads?folder=${encodeURIComponent(folder)}`,
          method: 'POST',
          body: formData,
        }
      },
    }),
  }),
})

export const { useUploadFilesMutation } = uploadsApi
