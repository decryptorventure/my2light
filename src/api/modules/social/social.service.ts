import { apiClient } from '../../core/client';
import { ApiResponse } from '../../core/types';
import { createApiError, ErrorCode } from '../../core/errorHandler';
import { CreateCommentSchema, CreateCommentInput } from './social.schema';
import { Comment } from './social.types';

class SocialService {
    async addComment(commentData: CreateCommentInput): Promise<ApiResponse<Comment>> {
        try {
            const validated = CreateCommentSchema.parse(commentData);

            const { data: { user }, error: authError } = await apiClient.supabase.auth.getUser();
            if (authError || !user) {
                throw createApiError(ErrorCode.AUTH_UNAUTHORIZED);
            }

            const { data, error } = await apiClient.supabase
                .from('comments')
                .insert({
                    user_id: user.id,
                    highlight_id: validated.highlightId,
                    text: validated.text,
                })
                .select('*, profiles(name, avatar)')
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
                error: error.message || 'Thêm comment thất bại',
            };
        }
    }

    async getComments(highlightId: string, limit = 50): Promise<ApiResponse<Comment[]>> {
        try {
            const { data, error } = await apiClient.supabase
                .from('comments')
                .select('*, profiles(name, avatar)')
                .eq('highlight_id', highlightId)
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
                error: error.message || 'Không thể lấy comments',
            };
        }
    }

    async followUser(userId: string): Promise<ApiResponse<boolean>> {
        try {
            const { data: { user }, error: authError } = await apiClient.supabase.auth.getUser();
            if (authError || !user) {
                throw createApiError(ErrorCode.AUTH_UNAUTHORIZED);
            }

            if (user.id === userId) {
                throw createApiError(ErrorCode.SOCIAL_CANNOT_FOLLOW_SELF);
            }

            // Check if already following
            const { data: existingFollow } = await apiClient.supabase
                .from('follows')
                .select('id')
                .eq('follower_id', user.id)
                .eq('following_id', userId)
                .single();

            if (existingFollow) {
                throw createApiError(ErrorCode.SOCIAL_ALREADY_FOLLOWING);
            }

            const { error } = await apiClient.supabase
                .from('follows')
                .insert({
                    follower_id: user.id,
                    following_id: userId,
                });

            if (error) throw error;

            return {
                success: true,
                data: true,
            };
        } catch (error: any) {
            return {
                success: false,
                data: false,
                error: error.message || 'Follow thất bại',
            };
        }
    }

    async unfollowUser(userId: string): Promise<ApiResponse<boolean>> {
        try {
            const { data: { user }, error: authError } = await apiClient.supabase.auth.getUser();
            if (authError || !user) {
                throw createApiError(ErrorCode.AUTH_UNAUTHORIZED);
            }

            const { error } = await apiClient.supabase
                .from('follows')
                .delete()
                .eq('follower_id', user.id)
                .eq('following_id', userId);

            if (error) throw error;

            return {
                success: true,
                data: true,
            };
        } catch (error: any) {
            return {
                success: false,
                data: false,
                error: error.message || 'Unfollow thất bại',
            };
        }
    }
}

export const socialService = new SocialService();
