import { apiClient } from '../../core/client';
import { ApiResponse } from '../../core/types';
import { createApiError, ErrorCode } from '../../core/errorHandler';
import {
    CreateCourtSchema,
    UpdateCourtSchema,
    CreateCourtInput,
    UpdateCourtInput,
} from './courts.schema';
import { Court, CourtDetails } from './courts.types';

class CourtsService {
    /**
     * Get all courts (public)
     */
    async getCourts(): Promise<ApiResponse<Court[]>> {
        try {
            const { data, error } = await apiClient.supabase
                .from('courts')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return {
                success: true,
                data: data || [],
            };
        } catch (error: any) {
            return {
                success: false,
                data: [],
                error: error.message || 'Không thể lấy danh sách sân',
            };
        }
    }

    /**
     * Get court by ID
     */
    async getCourtById(courtId: string): Promise<ApiResponse<CourtDetails | null>> {
        try {
            const { data, error } = await apiClient.supabase
                .from('courts')
                .select('*')
                .eq('id', courtId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    throw createApiError(ErrorCode.COURT_NOT_FOUND);
                }
                throw error;
            }

            return {
                success: true,
                data: data,
            };
        } catch (error: any) {
            return {
                success: false,
                data: null,
                error: error.message || 'Không tìm thấy sân',
            };
        }
    }

    /**
     * Create new court (court owner only)
     */
    async createCourt(courtData: CreateCourtInput): Promise<ApiResponse<Court>> {
        try {
            const validated = CreateCourtSchema.parse(courtData);

            const { data: { user }, error: authError } = await apiClient.supabase.auth.getUser();
            if (authError || !user) {
                throw createApiError(ErrorCode.AUTH_UNAUTHORIZED);
            }

            // Get court owner profile
            const { data: owner } = await apiClient.supabase
                .from('court_owners')
                .select('id')
                .eq('profile_id', user.id)
                .single();

            if (!owner) {
                throw createApiError(ErrorCode.AUTH_UNAUTHORIZED, 'Bạn không phải chủ sân');
            }

            const { data, error } = await apiClient.supabase
                .from('courts')
                .insert({
                    owner_id: owner.id,
                    name: validated.name,
                    address: validated.address,
                    description: validated.description,
                    price_per_hour: validated.pricePerHour,
                    open_time: validated.openTime,
                    close_time: validated.closeTime,
                    image_url: validated.imageUrl,
                    facilities: validated.facilities,
                    features: validated.features,
                    is_active: true,
                    status: 'available',
                    rating: 0,
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
                error: error.message || 'Tạo sân thất bại',
            };
        }
    }

    /**
     * Update court
     */
    async updateCourt(courtId: string, updates: UpdateCourtInput): Promise<ApiResponse<boolean>> {
        try {
            const validated = UpdateCourtSchema.parse(updates);

            const { error } = await apiClient.supabase
                .from('courts')
                .update(validated)
                .eq('id', courtId);

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
                error: error.message || 'Cập nhật sân thất bại',
            };
        }
    }

    async getPackages(): Promise<ApiResponse<any[]>> {
        try {
            const { data, error } = await apiClient.supabase
                .from('packages')
                .select('*')
                .eq('is_active', true)
                .order('price', { ascending: true });

            if (error) throw error;

            return {
                success: true,
                data: data || [],
            };
        } catch (error: any) {
            return {
                success: false,
                data: [],
                error: error.message || 'Không thể lấy danh sách gói',
            };
        }
    }
}

export const courtsService = new CourtsService();
