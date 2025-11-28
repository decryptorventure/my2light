import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    useHighlights,
    useCourts,
    useCurrentUser,
    useUpdateUserProfile,
    useTransactionHistory,
    useTransactionSummary,
    useBookingHistory,
    useAdminCourts,
    useDeleteCourt
} from './useApi';
import { ApiService } from '../../services/api';
import { AdminService } from '../../services/admin';
import { mockUser, mockCourt, mockHighlight, mockTransaction, mockBooking } from '../test/testUtils';
import React, { ReactNode } from 'react';
import { CourtDetails } from '../../types/admin';

const mockCourtDetails: CourtDetails = {
    ...mockCourt,
    ownerId: 'owner-123',
    isActive: true,
    autoApproveBookings: true,
    totalBookings: 10,
    monthlyRevenue: 1000000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
};

// Mock ApiService
vi.mock('../../services/api', () => ({
    ApiService: {
        getHighlights: vi.fn(),
        getCourts: vi.fn(),
        getCurrentUser: vi.fn(),
        updateUserProfile: vi.fn(),
        getTransactionHistory: vi.fn(),
        getTransactionSummary: vi.fn(),
        getBookingHistory: vi.fn(),
    }
}));

// Mock AdminService
vi.mock('../../services/admin', () => ({
    AdminService: {
        getCourts: vi.fn(),
        deleteCourt: vi.fn(),
    }
}));

// Wrapper for React Query
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useApi Hooks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useHighlights', () => {
        it('should fetch highlights successfully', async () => {
            // Arrange
            const mockData = [mockHighlight];
            vi.mocked(ApiService.getHighlights).mockResolvedValue({ success: true, data: mockData });

            // Act
            const { result } = renderHook(() => useHighlights(10), { wrapper: createWrapper() });

            // Assert
            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data).toEqual(mockData);
            expect(ApiService.getHighlights).toHaveBeenCalledWith(10);
        });
    });

    describe('useCourts', () => {
        it('should fetch courts successfully', async () => {
            // Arrange
            const mockData = [mockCourt];
            vi.mocked(ApiService.getCourts).mockResolvedValue({ success: true, data: mockData });

            // Act
            const { result } = renderHook(() => useCourts(), { wrapper: createWrapper() });

            // Assert
            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data).toEqual(mockData);
        });
    });

    describe('useCurrentUser', () => {
        it('should fetch current user successfully', async () => {
            // Arrange
            vi.mocked(ApiService.getCurrentUser).mockResolvedValue({ success: true, data: mockUser });

            // Act
            const { result } = renderHook(() => useCurrentUser(), { wrapper: createWrapper() });

            // Assert
            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data).toEqual(mockUser);
        });
    });

    describe('useUpdateUserProfile', () => {
        it('should update user profile and invalidate query', async () => {
            // Arrange
            vi.mocked(ApiService.updateUserProfile).mockResolvedValue({ success: true, data: true });

            // Act
            const { result } = renderHook(() => useUpdateUserProfile(), { wrapper: createWrapper() });

            result.current.mutate({ name: 'New Name' });

            // Assert
            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(ApiService.updateUserProfile).toHaveBeenCalledWith({ name: 'New Name' });
        });
    });

    describe('useTransactionHistory', () => {
        it('should fetch transaction history successfully', async () => {
            // Arrange
            const mockData = [mockTransaction];
            vi.mocked(ApiService.getTransactionHistory).mockResolvedValue({ success: true, data: mockData });

            // Act
            const { result } = renderHook(() => useTransactionHistory(20), { wrapper: createWrapper() });

            // Assert
            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data).toEqual(mockData);
            expect(ApiService.getTransactionHistory).toHaveBeenCalledWith(20);
        });
    });

    describe('useTransactionSummary', () => {
        it('should fetch transaction summary successfully', async () => {
            // Arrange
            const mockData = { total_spent: 100 };
            vi.mocked(ApiService.getTransactionSummary).mockResolvedValue({ success: true, data: mockData });

            // Act
            const { result } = renderHook(() => useTransactionSummary(), { wrapper: createWrapper() });

            // Assert
            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data).toEqual(mockData);
        });
    });

    describe('useBookingHistory', () => {
        it('should fetch booking history successfully', async () => {
            // Arrange
            const mockData = [mockBooking];
            vi.mocked(ApiService.getBookingHistory).mockResolvedValue({ success: true, data: mockData });

            // Act
            const { result } = renderHook(() => useBookingHistory(), { wrapper: createWrapper() });

            // Assert
            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data).toEqual(mockData);
        });
    });

    describe('useAdminCourts', () => {
        it('should fetch admin courts successfully', async () => {
            // Arrange
            const mockData = [mockCourtDetails];
            vi.mocked(AdminService.getCourts).mockResolvedValue({ success: true, data: mockData });

            // Act
            const { result } = renderHook(() => useAdminCourts(), { wrapper: createWrapper() });

            // Assert
            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data).toEqual(mockData);
        });
    });

    describe('useDeleteCourt', () => {
        it('should delete court and invalidate query', async () => {
            // Arrange
            vi.mocked(AdminService.deleteCourt).mockResolvedValue({ success: true, data: null });

            // Act
            const { result } = renderHook(() => useDeleteCourt(), { wrapper: createWrapper() });

            result.current.mutate('court-123');

            // Assert
            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(AdminService.deleteCourt).toHaveBeenCalledWith('court-123');
        });
    });
});
