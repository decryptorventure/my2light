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
                .select('*, profiles(name, avatar), courts(name)')
                .eq('is_public', true)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return {
                success: true,
                data: data || [],
            };
        } catch (error: any) {
            return {
                success: false,
                data: [],
                error: error.message || 'Không thể lấy highlights',
            };
        }
    }

    async getUserHighlights(userId: string, limit = 50): Promise<ApiResponse<Highlight[]>> {
        try {
            const { data, error } = await apiClient.supabase
                .from('highlights')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return {
                success: true,
                data: data || [],
            };
        } catch (error: any) {
            return {
                success: false,
                data: [],
                error: error.message || 'Không thể lấy highlights',
            };
        }
    }

    async uploadVideo(file: Blob): Promise<ApiResponse<string>> {
        try {
            const { data: { user }, error: authError } = await apiClient.supabase.auth.getUser();
            if (authError || !user) {
                throw createApiError(ErrorCode.AUTH_UNAUTHORIZED);
            }

            const fileName = `highlights/${user.id}/${Date.now()}.webm`;
            const { data, error } = await apiClient.supabase.storage
                .from('videos')
                .upload(fileName, file);

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
