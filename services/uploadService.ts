import { supabase } from '../lib/supabase';
import { VideoStorage, VideoChunk, SessionMetadata } from '../lib/storage';

export const UploadService = {
    async uploadSession(sessionId: string, onProgress?: (progress: number) => void): Promise<string | null> {
        try {
            // Get current user for RLS compliance
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const metadata = await VideoStorage.getSessionMetadata(sessionId);
            if (!metadata) throw new Error('Session metadata not found');

            const chunks = await VideoStorage.getAllChunksForSession(sessionId);
            if (chunks.length === 0) throw new Error('No video chunks found');

            // 1. Upload Chunks
            let uploadedBytes = 0;
            const totalBytes = chunks.reduce((acc, chunk) => acc + chunk.blob.size, 0);

            // Use userId as root folder to satisfy RLS: videos/{userId}/{sessionId}/...
            const uploadPromises = chunks.map(async (chunk) => {
                const path = `${user.id}/${sessionId}/${chunk.chunkId}.webm`;

                const { error } = await supabase.storage
                    .from('videos')
                    .upload(path, chunk.blob, {
                        upsert: true,
                    });

                if (error) throw error;

                uploadedBytes += chunk.blob.size;
                if (onProgress) {
                    onProgress((uploadedBytes / totalBytes) * 0.9); // 90% for chunks
                }
            });

            await Promise.all(uploadPromises);

            // 2. Upload Metadata
            const metadataPath = `${user.id}/${sessionId}/metadata.json`;
            const { error: metaError } = await supabase.storage
                .from('videos')
                .upload(metadataPath, JSON.stringify(metadata), {
                    contentType: 'application/json',
                    upsert: true
                });

            if (metaError) throw metaError;

            if (onProgress) onProgress(1); // 100%
            likes: 0,
                views: 0
        });

        if (dbError) {
            console.error('Failed to insert highlight record:', dbError);
        }

        // Return the folder path
        return `${user.id}/${sessionId}`;

    } catch(error) {
        console.error('Upload failed:', error);
        throw error;
    }
},

    async clearLocalSession(sessionId: string) {
        await VideoStorage.clearSessionChunks(sessionId);
        await VideoStorage.deleteSessionMetadata(sessionId);
    }
};
