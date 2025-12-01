import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes (improved from 1min)
            gcTime: 30 * 60 * 1000, // Keep unused data in cache for 30 minutes (improved from 5min)
            refetchOnWindowFocus: false, // Don't refetch on window focus
            retry: 1, // Retry failed requests once
            refetchOnReconnect: true, // Refetch on network reconnect
        },
        mutations: {
            retry: 0, // Don't retry mutations by default
        },
    },
});
