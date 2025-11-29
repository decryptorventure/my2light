import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UploadService } from './uploadService';
import { VideoStorage } from '../lib/storage';
import { supabase } from '../lib/supabase';

// Mock dependencies
vi.mock('../lib/storage', () => ({
    VideoStorage: {
        getSessionMetadata: vi.fn(),
        getAllChunksForSession: vi.fn(),
        clearSessionChunks: vi.fn(),
        deleteSessionMetadata: vi.fn(),
    },
}));

// Create mock functions for Supabase using vi.hoisted
const { mockUpload, mockFrom } = vi.hoisted(() => {
    const mockUpload = vi.fn();
    const mockFrom = vi.fn(() => ({
        upload: mockUpload
    }));
    return { mockUpload, mockFrom };
});

vi.mock('../lib/supabase', () => ({
    supabase: {
        storage: {
            from: mockFrom,
        },
    },
}));

describe('UploadService', () => {
    const sessionId = 'test-session-123';
    const mockMetadata = {
        sessionId,
        startTime: 1234567890,
        status: 'completed',
        chunkCount: 2,
        highlightEvents: [1234567900],
    };
    const mockChunks = [
        { sessionId, chunkId: 0, blob: new Blob(['chunk0'], { type: 'video/webm' }), timestamp: 123 },
        { sessionId, chunkId: 1, blob: new Blob(['chunk1'], { type: 'video/webm' }), timestamp: 456 },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset default implementations
        mockFrom.mockReturnValue({ upload: mockUpload });
        mockUpload.mockResolvedValue({ data: { path: 'some-path' }, error: null });
    });

    it('should upload all chunks and metadata successfully', async () => {
        // Setup mocks
        (VideoStorage.getSessionMetadata as any).mockResolvedValue(mockMetadata);
        (VideoStorage.getAllChunksForSession as any).mockResolvedValue(mockChunks);

        const onProgress = vi.fn();

        // Execute
        const result = await UploadService.uploadSession(sessionId, onProgress);

        // Verify
        expect(VideoStorage.getSessionMetadata).toHaveBeenCalledWith(sessionId);
        expect(VideoStorage.getAllChunksForSession).toHaveBeenCalledWith(sessionId);

        // Should upload 2 chunks + 1 metadata file
        expect(mockUpload).toHaveBeenCalledTimes(3);

        // Check chunk uploads
        expect(mockUpload).toHaveBeenCalledWith(
            `raw/${sessionId}/0.webm`,
            mockChunks[0].blob,
            expect.objectContaining({ upsert: true })
        );
        expect(mockUpload).toHaveBeenCalledWith(
            `raw/${sessionId}/1.webm`,
            mockChunks[1].blob,
            expect.objectContaining({ upsert: true })
        );

        // Check metadata upload
        expect(mockUpload).toHaveBeenCalledWith(
            `raw/${sessionId}/metadata.json`,
            expect.stringContaining(sessionId),
            expect.objectContaining({ contentType: 'application/json' })
        );

        // Check progress
        expect(onProgress).toHaveBeenCalled();
        expect(result).toBe(`raw/${sessionId}`);
    });

    it('should throw error if metadata is missing', async () => {
        (VideoStorage.getSessionMetadata as any).mockResolvedValue(null);

        await expect(UploadService.uploadSession(sessionId)).rejects.toThrow('Session metadata not found');
    });

    it('should throw error if no chunks found', async () => {
        (VideoStorage.getSessionMetadata as any).mockResolvedValue(mockMetadata);
        (VideoStorage.getAllChunksForSession as any).mockResolvedValue([]);

        await expect(UploadService.uploadSession(sessionId)).rejects.toThrow('No video chunks found');
    });

    it('should handle upload errors', async () => {
        (VideoStorage.getSessionMetadata as any).mockResolvedValue(mockMetadata);
        (VideoStorage.getAllChunksForSession as any).mockResolvedValue(mockChunks);

        // Mock failure
        mockUpload.mockResolvedValue({ data: null, error: new Error('Upload failed') });

        await expect(UploadService.uploadSession(sessionId)).rejects.toThrow('Upload failed');
    });

    it('should clear local session data', async () => {
        await UploadService.clearLocalSession(sessionId);

        expect(VideoStorage.clearSessionChunks).toHaveBeenCalledWith(sessionId);
        expect(VideoStorage.deleteSessionMetadata).toHaveBeenCalledWith(sessionId);
    });
});
