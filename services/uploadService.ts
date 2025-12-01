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

            // 3. Insert into Database (Highlights table)
            // Use the first chunk as the video URL for now (or a playlist if supported)
            const videoUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/${user.id}/${sessionId}/0.webm`;
            const thumbnailUrl = `https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=400&h=800&auto=format&fit=crop`; // Placeholder

            const { error: dbError } = await supabase.from('highlights').insert({
                user_id: user.id,
                court_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID for now
                title: `Highlight ${new Date().toLocaleString()}`,
                description: 'Recorded via My2Light App',
                video_url: videoUrl,
                thumbnail_url: thumbnailUrl,
                duration_sec: metadata.chunkCount * 10, // Approx
                is_public: true,
                likes: 0,
                views: 0
            });

            if (dbError) {
                console.error('Failed to insert highlight record:', dbError);
            }

            // Return the folder path
            return `${user.id}/${sessionId}`;

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
