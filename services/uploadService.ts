import { supabase } from '../lib/supabase';
import { VideoStorage, VideoChunk, SessionMetadata } from '../lib/storage';

export const UploadService = {
    async uploadSession(sessionId: string, onProgress?: (progress: number) => void, thumbnailBlob?: Blob | null): Promise<string | null> {
        try {
            const metadata = await VideoStorage.getSessionMetadata(sessionId);
            if (!metadata) throw new Error('Session metadata not found');

            const chunks = await VideoStorage.getAllChunksForSession(sessionId);
            if (chunks.length === 0) throw new Error('No video chunks found');

            // 1. Upload Chunks
            let uploadedBytes = 0;
            const totalBytes = chunks.reduce((acc, chunk) => acc + chunk.blob.size, 0) + (thumbnailBlob?.size || 0);

            const uploadPromises = chunks.map(async (chunk) => {
                const path = `raw/${sessionId}/${chunk.chunkId}.webm`;

                const { error } = await supabase.storage
                    .from('videos') // Ensure this bucket exists
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

            // 1.5 Upload Thumbnail (if exists)
            let thumbnailUrl = 'https://images.unsplash.com/photo-1542652694-40abf526446e?q=80&w=500&auto=format&fit=crop'; // Default
            if (thumbnailBlob) {
                const thumbPath = `raw/${sessionId}/thumbnail.jpg`;
                const { error: thumbError } = await supabase.storage
                    .from('videos')
                    .upload(thumbPath, thumbnailBlob, { upsert: true });

                if (!thumbError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('videos')
                        .getPublicUrl(thumbPath);
                    thumbnailUrl = publicUrl;
                    uploadedBytes += thumbnailBlob.size;
                    if (onProgress) onProgress((uploadedBytes / totalBytes) * 0.9);
                }
            }

            // 2. Upload Metadata
            const metadataPath = `raw/${sessionId}/metadata.json`;
            const { error: metaError } = await supabase.storage
                .from('videos')
                .upload(metadataPath, JSON.stringify(metadata), {
                    contentType: 'application/json',
                    upsert: true
                });

            if (metaError) throw metaError;

            // 3. Create Database Record
            const { data: { publicUrl } } = supabase.storage
                .from('videos')
                .getPublicUrl(`raw/${sessionId}/0.webm`); // Use first chunk as preview for now

            const { error: dbError } = await supabase
                .from('highlights')
                .insert({
                    user_id: (await supabase.auth.getUser()).data.user?.id,
                    title: `Highlight ${new Date().toLocaleString('vi-VN')}`,
                    description: 'Tự động quay bằng AI Voice',
                    thumbnail_url: thumbnailUrl,
                    video_url: publicUrl,
                    duration_sec: Math.round((metadata.chunkCount * 5)), // Approx duration
                    is_public: true
                });

            if (dbError) {
                console.error('DB Insert Error:', dbError);
                // Don't fail the whole upload if DB insert fails, but log it
            }

            if (onProgress) onProgress(1); // 100%

            return `raw/${sessionId}`;

        } catch (error) {
            console.error('Upload failed:', error);
            throw error;
        }
    },

    async clearLocalSession(sessionId: string) {
        await VideoStorage.clearSessionChunks(sessionId);
        await VideoStorage.deleteSessionMetadata(sessionId);
    }
};
