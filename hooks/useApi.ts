import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../services/api';
import { AdminService } from '../services/admin';
import type { Highlight } from '../types';

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
    bookings: {
        all: ['bookings'] as const,
        history: () => [...queryKeys.bookings.all, 'history'] as const,
    },
    admin: {
        courts: ['admin', 'courts'] as const,
    },
};

// ... (existing hooks)



// Admin Hooks
export function useAdminCourts() {
    return useQuery({
        queryKey: queryKeys.admin.courts,
        queryFn: async () => {
            const result = await AdminService.getCourts();
            return result.data;
        },
        staleTime: 300000, // 5 minutes
    });
}

export function useDeleteCourt() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (courtId: string) => AdminService.deleteCourt(courtId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.courts });
        },
    });
}

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

export function useBookingHistory() {
    return useQuery({
        queryKey: queryKeys.bookings.history(),
        queryFn: async () => {
            const result = await ApiService.getBookingHistory();
            return result.data;
        },
        staleTime: 60000,
    });
}
