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


            const { error: dbError } = await supabase.from('highlights').insert({
                user_id: user.id,
                court_id: courtId || null, // Allow null if no court found
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
                throw dbError; // Throw so we know it failed
            } else {
                console.log('✅ Highlight inserted successfully into DB');
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
