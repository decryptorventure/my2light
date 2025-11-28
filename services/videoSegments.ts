import { supabase } from '../lib/supabase';
import { VideoSegment, VideoProcessingJob } from '../types';

export const VideoSegmentService = {
    /**
     * Upload a video segment to Supabase Storage
     */
    async uploadSegment(blob: Blob, segmentId: string, userId: string): Promise<string | null> {
        try {
            const fileName = `${userId}/${segmentId}.webm`;
            const { data, error } = await supabase.storage
                .from('raw_segments')
                .upload(fileName, blob, {
                    contentType: 'video/webm',
                    upsert: true
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('raw_segments')
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading segment:', error);
            return null;
        }
    },

    /**
     * Save segment metadata to the database
     */
    async saveSegmentMetadata(segment: VideoSegment): Promise<VideoSegment | null> {
        try {
            const { data, error } = await supabase
                .from('video_segments')
                .insert({
                    id: segment.id,
                    recording_session_id: segment.recording_session_id,
                    user_id: segment.user_id, // Ensure this is set before calling
                    start_time: segment.start_time,
                    end_time: segment.end_time,
                    duration: segment.duration,
                    status: segment.status,
                    video_url: segment.video_url,
                    thumbnail_url: segment.thumbnail_url
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error saving segment metadata:', error);
            return null;
        }
    },

    /**
     * Trigger the merge-videos Edge Function
     */
    async mergeVideos(segmentIds: string[]): Promise<{ success: boolean; jobId?: string; error?: string }> {
        try {
            const { data, error } = await supabase.functions.invoke('merge-videos', {
                body: { segmentIds }
            });

            if (error) throw error;
            return data;
        } catch (error: any) {
            console.error('Error merging videos:', error);
            return { success: false, error: error.message };
        }
    }
};
