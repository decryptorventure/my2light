import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60000, // Data is fresh for 1 minute
            gcTime: 300000, // Keep unused data in cache for 5 minutes (formerly cacheTime)
            refetchOnWindowFocus: false, // Don't refetch on window focus
            retry: 1, // Retry failed requests once
            refetchOnReconnect: true, // Refetch on network reconnect
        },
        mutations: {
            retry: 0, // Don't retry mutations by default
        },
    },
});
