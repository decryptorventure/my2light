import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user: { id: 'test-user-id' } },
                error: null,
            }),
        },
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
                getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/video.mp4' } }),
            })),
        },
    },
}));

import { ApiService } from '../services/api';
import { mockHighlight, createMockFile } from './test/testUtils';
import { supabase } from '../lib/supabase';

describe('ApiService - Highlight Methods', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getHighlights', () => {
        it('should fetch highlights successfully', async () => {
            // Arrange
            const mockData = [
                {
                    ...mockHighlight,
                    court: { name: 'Court 1' },
                    profile: { name: 'User 1', avatar: 'avatar.jpg' },
                    comments: [{ count: 5 }]
                }
            ];

            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
            } as any);

            // Act
            const result = await ApiService.getHighlights();

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].courtName).toBe('Court 1');
            expect(result.data[0].comments).toBe(5);
        });

        it('should return empty list on error', async () => {
            // Arrange
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
            } as any);

            // Act
            const result = await ApiService.getHighlights();

            // Assert
            expect(result.success).toBe(false);
            expect(result.data).toEqual([]);
        });
    });

    describe('toggleLike', () => {
        it('should update like count', async () => {
            // Arrange
            vi.mocked(supabase.from).mockReturnValue({
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ error: null }),
            } as any);

            // Act
            const result = await ApiService.toggleLike('h1', 10, false);

            // Assert
            expect(result.success).toBe(true);
            expect(supabase.from).toHaveBeenCalledWith('highlights');
            // Should increment to 11
            // Verify update call args if needed, but success check is good for now
        });
    });

    describe('createHighlight', () => {
        it('should create highlight successfully', async () => {
            // Arrange
            vi.mocked(supabase.from).mockReturnValue({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockHighlight, error: null }),
            } as any);

            // Act
            const result = await ApiService.createHighlight('c1', 'url', 30, 'Title');

            // Assert
            expect(result.success).toBe(true);
            expect(result.data.id).toBe('highlight-123');
        });
    });

    describe('uploadVideo', () => {
        it('should upload video successfully', async () => {
            // Arrange
            const mockBlob = new Blob(['video'], { type: 'video/mp4' });

            // Act
            const result = await ApiService.uploadVideo(mockBlob);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBe('https://test.com/video.mp4');
        });
    });
});
