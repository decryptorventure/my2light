import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import type { Highlight } from '../../types';

// Query keys - centralized for cache management
export const queryKeys = {
    highlights: {
        all: ['highlights'] as const,
        lists: () => [...queryKeys.highlights.all, 'list'] as const,
        list: (limit: number) => [...queryKeys.highlights.lists(), { limit }] as const,
    },
    courts: {
        all: ['courts'] as const,
        lists: () => [...queryKeys.courts.all, 'list'] as const,
        detail: (id: string) => [...queryKeys.courts.all, 'detail', id] as const,
    },
    user: {
        current: ['user', 'current'] as const,
    },
    transactions: {
        all: ['transactions'] as const,
        history: (limit: number) => [...queryKeys.transactions.all, 'history', limit] as const,
        summary: () => [...queryKeys.transactions.all, 'summary'] as const,
    },
};

// Highlight Hooks
export function useHighlights(limit: number = 20) {
    return useQuery({
        queryKey: queryKeys.highlights.list(limit),
        queryFn: async () => {
            const result = await ApiService.getHighlights(limit);
            return result.data;
        },
        staleTime: 60000, // 1 minute
        enabled: true,
    });
}

// Court Hooks  
export function useCourts() {
    return useQuery({
        queryKey: queryKeys.courts.lists(),
        queryFn: async () => {
            const result = await ApiService.getCourts();
            return result.data;
        },
        staleTime: 300000, // 5 minutes
    });
}

// User Hooks
export function useCurrentUser() {
    return useQuery({
        queryKey: queryKeys.user.current,
        queryFn: async () => {
            const result = await ApiService.getCurrentUser();
            return result.data;
        },
        staleTime: 300000,
        retry: 1,
    });
}

export function useUpdateUserProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (updates: any) => ApiService.updateUserProfile(updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.user.current });
        },
    });
}

// Transaction Hooks
export function useTransactionHistory(limit: number = 50) {
    return useQuery({
        queryKey: queryKeys.transactions.history(limit),
        queryFn: async () => {
            const result = await ApiService.getTransactionHistory(limit);
            return result.data;
        },
        staleTime: 60000,
    });
}

export function useTransactionSummary() {
    return useQuery({
        queryKey: queryKeys.transactions.summary(),
        queryFn: async () => {
            const result = await ApiService.getTransactionSummary();
            return result.data;
        },
        staleTime: 300000,
    });
}
