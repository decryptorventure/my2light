import { supabase } from '../lib/supabase';
import { VideoSegment, VideoProcessingJob } from '../types';

export const VideoSegmentService = {
    // Extract a segment from full recording blob
    extractSegment: async (
        fullBlob: Blob,
        startTime: number,
        endTime: number
    ): Promise<Blob> => {
        // This is a simplified version. For production, use FFmpeg.wasm or server-side processing
        // For now, we'll just return the full blob as placeholder
        // In reality, you'd need to:
        // 1. Load video into a video element
        // 2. Use MediaRecorder to record the specific time range
        // 3. Return the extracted blob

        console.warn('extractSegment: Using full blob as placeholder. Implement proper extraction.');
        return fullBlob;
    },

    // Upload segment to Supabase Storage
    uploadSegment: async (blob: Blob, segmentId: string, userId: string): Promise<string | null> => {
        try {
            const fileName = `segments/${userId}/${segmentId}.webm`;
            const { error: uploadError } = await supabase.storage
                .from('videos')
                .upload(fileName, blob, {
                    contentType: 'video/webm',
                    upsert: false
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                return null;
            }

            const { data } = supabase.storage
                .from('videos')
                .getPublicUrl(fileName);

            return data.publicUrl;
        } catch (error) {
            console.error('Upload segment error:', error);
            return null;
        }
    },

    // Save segment metadata to database
    saveSegmentMetadata: async (segment: Omit<VideoSegment, 'video_url' | 'created_at'>): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('video_segments')
                .insert({
                    id: segment.id,
                    recording_session_id: segment.recording_session_id,
                    user_id: segment.user_id,
                    start_time: segment.start_time,
                    end_time: segment.end_time,
                    duration: segment.duration,
                    status: segment.status
                });

            if (error) {
                console.error('Save segment metadata error:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Save segment metadata exception:', error);
            return false;
        }
    },

    // Update segment with video URL after upload
    updateSegmentUrl: async (segmentId: string, videoUrl: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('video_segments')
                .update({ video_url: videoUrl, status: 'uploaded' })
                .eq('id', segmentId);

            if (error) {
                console.error('Update segment URL error:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Update segment URL exception:', error);
            return false;
        }
    },

    // Call Edge Function to merge videos
    mergeVideos: async (segmentIds: string[]): Promise<{ success: boolean; jobId?: string; videoUrl?: string; error?: string }> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                return { success: false, error: 'Not authenticated' };
            }

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/merge-videos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ segmentIds })
            });

            const result = await response.json();

            if (!response.ok) {
                return { success: false, error: result.error || 'Merge failed' };
            }

            return {
                success: true,
                jobId: result.jobId,
                videoUrl: result.videoUrl
            };
        } catch (error: any) {
            console.error('Merge videos error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get processing job status
    getProcessingJob: async (jobId: string): Promise<VideoProcessingJob | null> => {
        try {
            const { data, error } = await supabase
                .from('video_processing_jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            if (error) {
                console.error('Get processing job error:', error);
                return null;
            }

            return data as VideoProcessingJob;
        } catch (error) {
            console.error('Get processing job exception:', error);
            return null;
        }
    }
};
