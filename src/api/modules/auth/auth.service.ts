import { apiClient } from '../../core/client';
import { ApiResponse } from '../../core/types';
import { createApiError, ErrorCode } from '../../core/errorHandler';
import {
    LoginSchema,
    RegisterSchema,
    UpdateProfileSchema,
    LoginInput,
    RegisterInput,
    UpdateProfileInput,
} from './auth.schema';
import { User } from '../../../../types';

/**
 * Auth Service
 * Handles authentication and user profile operations
 */
class AuthService {
    /**
     * Login with phone and password
     */
    async login(credentials: LoginInput): Promise<ApiResponse<User>> {
        try {
            // Validate input
            const validated = LoginSchema.parse(credentials);

            // Supabase auth login
            const { data, error } = await apiClient.supabase.auth.signInWithPassword({
                phone: validated.phone,
                password: validated.password,
            });

            if (error) {
                throw createApiError(ErrorCode.AUTH_INVALID_CREDENTIALS, error);
            }

            if (!data.user) {
                throw createApiError(ErrorCode.AUTH_SESSION_NOT_FOUND);
            }

            // Fetch user profile
            const userResponse = await this.getCurrentUser();

            return userResponse;
        } catch (error: any) {
            // If it's a Zod validation error
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
                error: error.message || 'Đăng nhập thất bại',
            };
        }
    }

    /**
     * Register new user
     */
    async register(data: RegisterInput): Promise<ApiResponse<User>> {
        try {
            // Validate input
            const validated = RegisterSchema.parse(data);

            // Supabase auth signup
            const { data: authData, error } = await apiClient.supabase.auth.signUp({
                phone: validated.phone,
                password: validated.password,
                options: {
                    data: {
                        name: validated.name,
                    },
                },
            });

            if (error) {
                throw createApiError(ErrorCode.AUTH_INVALID_CREDENTIALS, error);
            }

            if (!authData.user) {
                throw createApiError(ErrorCode.AUTH_SESSION_NOT_FOUND);
            }

            // Create profile record
            const { error: profileError } = await apiClient.supabase
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    name: validated.name,
                    phone: validated.phone,
                    credits: 0,
                    membership_tier: 'free',
                    has_onboarded: false,
                    is_public: true,
                    followers_count: 0,
                    following_count: 0,
                });

            if (profileError) {
                console.error('Profile creation error:', profileError);
            }

            // Fetch user profile
            const userResponse = await this.getCurrentUser();

            return userResponse;
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
                error: error.message || 'Đăng ký thất bại',
            };
        }
    }

    /**
     * Get current user profile
     */
    async getCurrentUser(): Promise<ApiResponse<User>> {
        try {
            const { data: { user }, error: authError } = await apiClient.supabase.auth.getUser();

            if (authError || !user) {
                throw createApiError(ErrorCode.AUTH_UNAUTHORIZED);
            }

            // Fetch profile from database
            const { data: profile, error: profileError } = await apiClient.supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError || !profile) {
                throw createApiError(ErrorCode.AUTH_SESSION_NOT_FOUND, profileError);
            }

            // Map to User type
            const userData: User = {
                id: profile.id,
                name: profile.name || '',
                avatar: profile.avatar || '',
                phone: profile.phone || '',
                totalHighlights: 0, // TODO: Count from highlights table
                hoursPlayed: 0, // TODO: Calculate from bookings
                courtsVisited: 0, // TODO: Count distinct courts
                credits: profile.credits || 0,
                membershipTier: profile.membership_tier || 'free',
                role: profile.role,
                bio: profile.bio,
                isPublic: profile.is_public,
                followersCount: profile.followers_count || 0,
                followingCount: profile.following_count || 0,
            };

            return {
                success: true,
                data: userData,
            };
        } catch (error: any) {
            return {
                success: false,
                data: null as any,
                error: error.message || 'Không thể lấy thông tin người dùng',
            };
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(updates: UpdateProfileInput): Promise<ApiResponse<boolean>> {
        try {
            // Validate input
            const validated = UpdateProfileSchema.parse(updates);

            const { data: { user }, error: authError } = await apiClient.supabase.auth.getUser();

            if (authError || !user) {
                throw createApiError(ErrorCode.AUTH_UNAUTHORIZED);
            }

            // Update profile
            const { error } = await apiClient.supabase
                .from('profiles')
                .update(validated)
                .eq('id', user.id);

            if (error) {
                throw error;
            }

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
                error: error.message || 'Cập nhật profile thất bại',
            };
        }
    }

    /**
     * Upload avatar
     */
    async uploadAvatar(file: File): Promise<ApiResponse<string>> {
        try {
            const { data: { user }, error: authError } = await apiClient.supabase.auth.getUser();

            if (authError || !user) {
                throw createApiError(ErrorCode.AUTH_UNAUTHORIZED);
            }

            // Upload to storage
            const fileName = `avatars/${user.id}/${Date.now()}.${file.name.split('.').pop()}`;
            const { data, error } = await apiClient.supabase.storage
                .from('avatars')
                .upload(fileName, file, {
                    upsert: true,
                });

            if (error) {
                throw error;
            }

            // Get public URL
            const { data: { publicUrl } } = apiClient.supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            // Update profile with new avatar URL
            await this.updateProfile({ avatar: publicUrl });

            return {
                success: true,
                data: publicUrl,
            };
        } catch (error: any) {
            return {
                success: false,
                data: '',
                error: error.message || 'Upload avatar thất bại',
            };
        }
    }

    /**
     * Sign out
     */
    async signOut(): Promise<ApiResponse<boolean>> {
        try {
            const { error } = await apiClient.supabase.auth.signOut();

            if (error) {
                throw error;
            }

            return {
                success: true,
                data: true,
            };
        } catch (error: any) {
            return {
                success: false,
                data: false,
                error: error.message || 'Đăng xuất thất bại',
            };
        }
    }
}

// Export singleton instance
export const authService = new AuthService();
