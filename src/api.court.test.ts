import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
    },
}));

import { ApiService } from '../services/api';
import { mockCourt } from './test/testUtils';
import { supabase } from '../lib/supabase';

describe('ApiService - Court Methods', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getCourts', () => {
        it('should fetch active courts successfully', async () => {
            // Arrange
            const mockCourts = [mockCourt, { ...mockCourt, id: 'court-456' }];

            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ data: mockCourts, error: null }),
            } as any);

            // Act
            const result = await ApiService.getCourts();

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
            expect(result.data[0].id).toBe('court-123');
            expect(supabase.from).toHaveBeenCalledWith('courts');
        });

        it('should return empty list on error', async () => {
            // Arrange
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
            } as any);

            // Act
            const result = await ApiService.getCourts();

            // Assert
            expect(result.success).toBe(false);
            expect(result.data).toEqual([]);
        });
    });

    describe('getCourtById', () => {
        it('should fetch court by id successfully', async () => {
            // Arrange
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockCourt, error: null }),
            } as any);

            // Act
            const result = await ApiService.getCourtById('court-123');

            // Assert
            expect(result.success).toBe(true);
            expect(result.data?.id).toBe('court-123');
        });

        it('should return error if court not found', async () => {
            // Arrange
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
            } as any);

            // Act
            const result = await ApiService.getCourtById('invalid-id');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Not found');
        });
    });

    describe('getPackages', () => {
        it('should fetch packages successfully', async () => {
            // Arrange
            const mockPackages = [
                { id: 'p1', name: 'Standard', price: 50000, duration_minutes: 60 },
                { id: 'p2', name: 'Premium', price: 100000, duration_minutes: 120 }
            ];

            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockResolvedValue({ data: mockPackages, error: null }),
            } as any);

            // Act
            const result = await ApiService.getPackages();

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
            expect(result.data[0].name).toBe('Standard');
        });

        it('should return empty list on error', async () => {
            // Arrange
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
            } as any);

            // Act
            const result = await ApiService.getPackages();

            // Assert
            expect(result.success).toBe(false);
            expect(result.data).toEqual([]);
        });
    });
});
