import { supabase } from '../lib/supabase';
import { VideoStorage, VideoChunk, SessionMetadata } from '../lib/storage';

export const UploadService = {
    async uploadSession(
        sessionId: string,
        onProgress?: (progress: number) => void,
        metadata?: {
            title?: string;
            description?: string;
            courtId?: string | null;
            highlightEvents?: any[];
            duration?: number;
        }
    ): Promise<string> {
        try {
            // Get current user for RLS compliance
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const sessionMeta = await VideoStorage.getSessionMetadata(sessionId);
            if (!sessionMeta) throw new Error('Session metadata not found');

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
                .upload(metadataPath, JSON.stringify(sessionMeta), {
                    contentType: 'application/json',
                    upsert: true
                });

            if (metaError) throw metaError;

            // 3. Create Full Video Blob & Upload (Optional but good for preview)
            // For now we rely on chunks, but we could upload a merged file here if we did the merge client-side.
            // Let's stick to chunks for storage efficiency unless we need a single file URL.
            // Actually, for the "video_url" in DB, we need a playable URL.
            // Since we can't easily merge on client without re-encoding or just concatenating (which might be buggy for some players),
            // we will point to the first chunk or a playlist.
            // BETTER APPROACH: Upload the merged blob as 'full.webm'

            const fullBlob = await VideoStorage.getSessionBlob(sessionId);
            let videoUrl = '';

            if (fullBlob) {
                const fullPath = `${user.id}/${sessionId}/full.webm`;
                const { error: fullUploadError } = await supabase.storage
                    .from('videos')
                    .upload(fullPath, fullBlob, { upsert: true });

                if (!fullUploadError) {
                    const { data } = supabase.storage.from('videos').getPublicUrl(fullPath);
                    videoUrl = data.publicUrl;
                }
            }

            // Fallback if full upload fails
            if (!videoUrl) {
                const firstChunkPath = `${user.id}/${sessionId}/0.webm`;
                const { data } = supabase.storage.from('videos').getPublicUrl(firstChunkPath);
                videoUrl = data.publicUrl;
            }

            if (onProgress) onProgress(1); // 100%

            // 4. Insert into Database (Highlights table)
            // Generate thumbnail from the full video blob if possible
            let thumbnailUrl = 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=400&h=800&auto=format&fit=crop'; // Fallback

            if (fullBlob) {
                try {
                    const thumbBlob = await this.generateThumbnail(fullBlob);
                    if (thumbBlob) {
                        const thumbPath = `${user.id}/${sessionId}/thumbnail.jpg`;
                        const { error: thumbError } = await supabase.storage
                            .from('videos')
                            .upload(thumbPath, thumbBlob, { upsert: true, contentType: 'image/jpeg' });

                        if (!thumbError) {
                            const { data } = supabase.storage.from('videos').getPublicUrl(thumbPath);
                            thumbnailUrl = data.publicUrl;
                        }
                    }
                } catch (err) {
                    console.error('Failed to generate thumbnail:', err);
                }
            }

            // Ensure we have a valid court_id (optional)
            let finalCourtId = metadata?.courtId;
            if (!finalCourtId) {
                // Try to find a default court or leave null
                const { data: courts } = await supabase.from('courts').select('id').limit(1);
                if (courts && courts.length > 0) {
                    // finalCourtId = courts[0].id; // Optional: auto-assign
                }
            }

            const { error: dbError } = await supabase.from('highlights').insert({
                user_id: user.id,
                court_id: finalCourtId || null,
                video_url: videoUrl,
                thumbnail_url: thumbnailUrl,
                duration_sec: metadata?.duration || sessionMeta.chunkCount * 10,
                title: metadata?.title || `Highlight ${new Date().toLocaleString()}`,
                description: metadata?.description || 'Recorded via My2Light App',
                highlight_events: metadata?.highlightEvents || sessionMeta.highlightEvents || [],
                likes: 0,
                views: 0,
                is_public: true
            });

            if (dbError) {
                console.error('Failed to insert highlight record:', dbError);
                // We don't throw here to avoid "failing" the upload if just the DB insert failed
                // But in a real app we might want to retry or alert.
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

    async generateThumbnail(videoBlob: Blob): Promise<Blob | null> {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.src = URL.createObjectURL(videoBlob);
            video.muted = true;
            video.playsInline = true;

            video.onloadedmetadata = () => {
                // Seek to 1 second or 10% of duration
                video.currentTime = Math.min(1, video.duration * 0.1);
            };

            video.onseeked = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        canvas.toBlob((blob) => {
                            URL.revokeObjectURL(video.src);
                            resolve(blob);
                        }, 'image/jpeg', 0.8);
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    console.error('Canvas error:', e);
                    resolve(null);
                }
            };

            video.onerror = () => {
                resolve(null);
            };
        });
    },

    async clearLocalSession(sessionId: string) {
        await VideoStorage.clearSessionChunks(sessionId);
        await VideoStorage.deleteSessionMetadata(sessionId);
    }
};
