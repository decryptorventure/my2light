import { apiClient } from '../../core/client';
import { ApiResponse } from '../../core/types';
import { createApiError, ErrorCode } from '../../core/errorHandler';
import {
    CreateHighlightSchema,
    UpdateHighlightSchema,
    CreateHighlightInput,
    UpdateHighlightInput,
} from './highlights.schema';
import { Highlight } from './highlights.types';

class HighlightsService {
    async getHighlights(limit = 10): Promise<ApiResponse<Highlight[]>> {
        try {
            const { data, error } = await apiClient.supabase
                .from('highlights')
                .select(`
                    id,
                    user_id,
                    court_id,
                    video_url,
                    thumbnail_url,
                    duration_sec,
                    title,
                    description,
                    created_at,
                    likes,
                    views,
                    is_public,
                    highlight_events,
                    profiles(name, avatar),
                    courts(name)
                `)
                .eq('is_public', true)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            // Transform snake_case to camelCase
            const highlights = (data || []).map((h: any) => ({
                id: h.id,
                userId: h.user_id,
                courtId: h.court_id,
                videoUrl: h.video_url,
                thumbnailUrl: h.thumbnail_url,
                durationSec: h.duration_sec,
                title: h.title,
                description: h.description,
                createdAt: h.created_at,
                likes: h.likes,
                views: h.views,
                isPublic: h.is_public,
                highlightEvents: h.highlight_events || [],
                // Nested data
                userName: h.profiles?.name || h.profiles?.full_name || h.profiles?.username || 'Unknown',
                userAvatar: h.profiles?.avatar || h.profiles?.avatar_url || '',
                courtName: h.courts?.name || 'My2Light',
            }));

            return {
                success: true,
                data: highlights,
            };
        } catch (error: any) {
            return {
                success: false,
                data: [],
                error: error.message || 'Không thể lấy highlights',
            };
        }
    }

    async getHighlightById(id: string): Promise<ApiResponse<Highlight>> {
        try {
            const { data, error } = await apiClient.supabase
                .from('highlights')
                .select(`
                    id,
                    user_id,
                    court_id,
                    video_url,
                    thumbnail_url,
                    duration_sec,
                    title,
                    description,
                    created_at,
                    likes,
                    views,
                    is_public,
                    highlight_events,
                    profiles(name, avatar),
                    courts(name)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            // Transform snake_case to camelCase
            const h = data as any;
            const highlight: Highlight = {
                id: h.id,
                userId: h.user_id,
                courtId: h.court_id,
                videoUrl: h.video_url,
                thumbnailUrl: h.thumbnail_url,
                durationSec: h.duration_sec,
                title: h.title,
                description: h.description,
                createdAt: h.created_at,
                likes: h.likes,
                views: h.views,
                isPublic: h.is_public,
                highlightEvents: h.highlight_events || [],
                // Nested data - single object for single result
                // Handle different possible profile field names
                userName: h.profiles?.name || h.profiles?.full_name || h.profiles?.username || 'Unknown',
                userAvatar: h.profiles?.avatar || h.profiles?.avatar_url || '',
                courtName: h.courts?.name || 'My2Light',
            };
            return {
                success: true,
                data: highlight,
            };
        } catch (error: any) {
            return {
                success: false,
                data: null as any,
                error: error.message || 'Không thể lấy highlight',
            };
        }
    }

    async getUserHighlights(userId: string, limit = 50): Promise<ApiResponse<Highlight[]>> {
        try {
            const { data, error } = await apiClient.supabase
                .from('highlights')
                .select(`
                    id,
                    user_id,
                    court_id,
                    video_url,
                    thumbnail_url,
                    duration_sec,
                    title,
                    description,
                    created_at,
                    likes,
                    views,
                    is_public,
                    highlight_events
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            // Transform snake_case to camelCase
            const highlights = (data || []).map((h: any) => ({
                id: h.id,
                userId: h.user_id,
                courtId: h.court_id,
                videoUrl: h.video_url,
                thumbnailUrl: h.thumbnail_url,
                durationSec: h.duration_sec,
                title: h.title,
                description: h.description,
                createdAt: h.created_at,
                likes: h.likes,
                views: h.views,
                isPublic: h.is_public,
                highlightEvents: h.highlight_events || [],
            }));

            return {
                success: true,
                data: highlights,
            };
        } catch (error: any) {
            return {
                success: false,
                data: [],
                error: error.message || 'Không thể lấy highlights',
            };
        }
    }

    async uploadVideo(file: Blob, compress = true): Promise<ApiResponse<string>> {
        try {
            const { data: { user }, error: authError } = await apiClient.supabase.auth.getUser();
            if (authError || !user) {
                throw createApiError(ErrorCode.AUTH_UNAUTHORIZED);
            }

            let fileToUpload = file;
            let fileExtension = 'webm';

            if (compress) {
                try {
                    // Dynamic import to avoid loading FFmpeg on initial bundle
                    const { compressVideo } = await import('../../../utils/videoCompressor');
                    const compressedBlob = await compressVideo(file);
                    fileToUpload = compressedBlob;
                    fileExtension = 'mp4'; // Compressor outputs mp4
                } catch (e) {
                    console.warn('Compression failed, uploading original file', e);
                }
            }

            const fileName = `highlights/${user.id}/${Date.now()}.${fileExtension}`;
            const { data, error } = await apiClient.supabase.storage
                .from('videos')
                .upload(fileName, fileToUpload);

            if (error) throw error;

            const { data: { publicUrl } } = apiClient.supabase.storage
                .from('videos')
                .getPublicUrl(fileName);

            return {
                success: true,
                data: publicUrl,
            };
        } catch (error: any) {
            return {
                success: false,
                data: '',
                error: error.message || 'Upload video thất bại',
            };
        }
    }

    async createHighlight(highlightData: CreateHighlightInput): Promise<ApiResponse<Highlight>> {
        try {
            const validated = CreateHighlightSchema.parse(highlightData);

            const { data: { user }, error: authError } = await apiClient.supabase.auth.getUser();
            if (authError || !user) {
                throw createApiError(ErrorCode.AUTH_UNAUTHORIZED);
            }

            const { data, error } = await apiClient.supabase
                .from('highlights')
                .insert({
                    user_id: user.id,
                    court_id: validated.courtId,
                    video_url: validated.videoUrl,
                    duration_sec: validated.duration || 0,
                    title: validated.title,
                    description: validated.description,
                    is_public: validated.isPublic !== false,
                    likes: 0,
                    views: 0,
                })
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                data: data,
            };
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return {
                    success: false,
                    data: null as any,
                    error: error.errors[0].message,
                };
            }

            return {
                success: false,
                data: null as any,
                error: error.message || 'Tạo highlight thất bại',
            };
        }
    }

    async updateHighlight(highlightId: string, updates: UpdateHighlightInput): Promise<ApiResponse<boolean>> {
        try {
            const validated = UpdateHighlightSchema.parse(updates);

            const { error } = await apiClient.supabase
                .from('highlights')
                .update(validated)
                .eq('id', highlightId);

            if (error) throw error;

            return {
                success: true,
                data: true,
            };
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return {
                    success: false,
                    data: false,
                    error: error.errors[0].message,
                };
            }

            return {
                success: false,
                data: false,
                error: error.message || 'Cập nhật highlight thất bại',
            };
        }
    }

    async toggleLike(highlightId: string): Promise<ApiResponse<boolean>> {
        try {
            const { data: { user }, error: authError } = await apiClient.supabase.auth.getUser();
            if (authError || !user) {
                throw createApiError(ErrorCode.AUTH_UNAUTHORIZED);
            }

            // Check if already liked
            const { data: existingLike } = await apiClient.supabase
                .from('likes')
                .select('id')
                .eq('user_id', user.id)
                .eq('highlight_id', highlightId)
                .single();

            if (existingLike) {
                // Unlike
                await apiClient.supabase
                    .from('likes')
                    .delete()
                    .eq('id', existingLike.id);
            } else {
                // Like
                await apiClient.supabase
                    .from('likes')
                    .insert({
                        user_id: user.id,
                        highlight_id: highlightId,
                    });
            }

            return {
                success: true,
                data: !existingLike,
            };
        } catch (error: any) {
            return {
                success: false,
                data: false,
                error: error.message || 'Thao tác thất bại',
            };
        }
    }
}

export const highlightsService = new HighlightsService();
