import { supabase } from '../lib/supabase';
import { VideoStorage, VideoChunk, SessionMetadata } from '../lib/storage';
import { isIOSSafari } from '../lib/browserDetect';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;

console.log('🔧 Cloudinary Config:', {
    cloudName: CLOUDINARY_CLOUD_NAME,
    uploadPreset: CLOUDINARY_UPLOAD_PRESET,
    uploadUrl: CLOUDINARY_UPLOAD_URL
});

const PLACEHOLDER_THUMBNAIL_URL = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=300&fit=crop';

export const UploadService = {
    /**
     * Upload video session to Cloudinary (handles webm → mp4 conversion automatically)
     */
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
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            console.log('📹 Starting Cloudinary upload for session:', sessionId);

            // Get full video blob from IndexedDB
            const fullBlob = await VideoStorage.getSessionBlob(sessionId);
            if (!fullBlob) {
                throw new Error('No video data found for session');
            }

            console.log(`📦 Video blob size: ${(fullBlob.size / 1024 / 1024).toFixed(2)} MB`);

            // Upload to Cloudinary
            if (onProgress) onProgress(0.1); // Starting upload

            const formData = new FormData();
            formData.append('file', fullBlob);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            formData.append('folder', `my2light/videos/${user.id}`);
            formData.append('resource_type', 'video');
            formData.append('public_id', sessionId); // Use sessionId as filename

            console.log('☁️ Uploading to Cloudinary...');

            const uploadResponse = await fetch(CLOUDINARY_UPLOAD_URL, {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                console.error('Cloudinary upload failed:', errorText);
                throw new Error(`Cloudinary upload failed: ${uploadResponse.statusText}`);
            }

            const cloudinaryData = await uploadResponse.json();
            console.log('✅ Cloudinary upload successful:', cloudinaryData);

            if (onProgress) onProgress(0.7); // Upload complete, processing

            // Cloudinary URLs (automatically converted to MP4!)
            const videoUrl = cloudinaryData.secure_url; // MP4 URL
            const thumbnailUrl = cloudinaryData.secure_url.replace(/\.(mp4|webm|mov)$/, '.jpg'); // Auto-generated thumbnail

            console.log('🎥 Video URL (MP4):', videoUrl);
            console.log('🖼️ Thumbnail URL:', thumbnailUrl);

            if (onProgress) onProgress(0.9); // Saving to database

            // Save to Supabase database
            const { data: highlight, error: insertError } = await supabase
                .from('highlights')
                .insert({
                    user_id: user.id,
                    video_url: videoUrl,
                    thumbnail_url: thumbnailUrl,
                    title: metadata?.title || 'Untitled Highlight',
                    description: metadata?.description || '',
                    court_id: metadata?.courtId || null,
                    highlight_events: metadata?.highlightEvents || [],
                    duration_sec: metadata?.duration || 0,
                })
                .select()
                .single();

            if (insertError) {
                console.error('❌ Database insert error:', insertError);
                throw new Error(`Failed to save highlight: ${insertError.message}`);
            }

            console.log('✅ Highlight saved to database:', highlight.id);

            if (onProgress) onProgress(1.0); // Complete!

            // Clean up local storage
            await this.clearLocalSession(sessionId);

            return highlight.id;

        } catch (error) {
            console.error('❌ Upload failed:', error);
            throw error;
        }
    },

    /**
     * Generate video thumbnail from blob (FALLBACK - Cloudinary auto-generates)
     * Keep this for backwards compatibility
     */
    async generateThumbnail(videoBlob: Blob): Promise<Blob | null> {
        return new Promise((resolve) => {
            const TIMEOUT_MS = isIOSSafari() ? 3000 : 10000;
            let resolved = false;
            let timeoutId: NodeJS.Timeout;

            const video = document.createElement('video');
            video.crossOrigin = 'anonymous';
            video.muted = true;
            video.playsInline = true;

            const videoUrl = URL.createObjectURL(videoBlob);

            const cleanup = () => {
                if (timeoutId) clearTimeout(timeoutId);
                URL.revokeObjectURL(videoUrl);
                video.src = '';
            };

            video.onloadedmetadata = () => {
                if (resolved) return;

                if (!isFinite(video.duration) || video.duration === 0) {
                    console.warn('⚠️ Invalid video duration, using placeholder');
                    resolved = true;
                    cleanup();
                    resolve(null);
                    return;
                }

                const seekTime = Math.min(2, video.duration / 2);
                video.currentTime = seekTime;
            };

            video.onseeked = () => {
                if (resolved) return;

                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = 640;
                    canvas.height = 360;
                    const ctx = canvas.getContext('2d');

                    if (!ctx) {
                        throw new Error('Failed to get canvas context');
                    }

                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    canvas.toBlob(
                        (blob) => {
                            resolved = true;
                            cleanup();
                            if (blob) {
                                console.log(`✅ Thumbnail generated: ${(blob.size / 1024).toFixed(2)} KB`);
                                resolve(blob);
                            } else {
                                console.warn('⚠️ Failed to create thumbnail blob');
                                resolve(null);
                            }
                        },
                        'image/jpeg',
                        0.85
                    );
                } catch (err) {
                    console.error('❌ Thumbnail generation error:', err);
                    resolved = true;
                    cleanup();
                    resolve(null);
                }
            };

            video.onerror = (e) => {
                if (resolved) return;
                console.error('❌ Video load failed (iOS Safari + webm issue?):', e);
                resolved = true;
                cleanup();
                resolve(null);
            };

            timeoutId = setTimeout(() => {
                if (!resolved) {
                    console.warn(`⏱️ Thumbnail generation timeout after ${TIMEOUT_MS}ms`);
                    resolved = true;
                    cleanup();
                    resolve(null);
                }
            }, TIMEOUT_MS);

            video.src = videoUrl;
            video.load();
        });
    },

    async clearLocalSession(sessionId: string) {
        await VideoStorage.clearSessionChunks(sessionId);
        await VideoStorage.deleteSessionMetadata(sessionId);
    }
};
