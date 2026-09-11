import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './http'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Nothing is gained by retrying a 401/403/404/422 - the answer won't change.
      retry: (attempt, error) =>
        !(error instanceof ApiError && error.status < 500) && attempt < 2,
    },
  },
})
