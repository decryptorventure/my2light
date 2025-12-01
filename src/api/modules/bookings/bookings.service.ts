import { apiClient } from '../../core/client';
import { ApiResponse } from '../../core/types';
import { createApiError, ErrorCode } from '../../core/errorHandler';
import {
    CreateBookingSchema,
    UpdateBookingSchema,
    CreateBookingInput,
    UpdateBookingInput,
} from './bookings.schema';
import { Booking } from './bookings.types';

class BookingsService {
    async createBooking(bookingData: CreateBookingInput): Promise<ApiResponse<Booking>> {
        try {
            const validated = CreateBookingSchema.parse(bookingData);

            const { data: { user }, error: authError } = await apiClient.supabase.auth.getUser();
            if (authError || !user) {
                throw createApiError(ErrorCode.AUTH_UNAUTHORIZED);
            }

            const endTime = validated.startTime + (validated.durationHours * 3600000);

            const { data, error } = await apiClient.supabase
                .from('bookings')
                .insert({
                    user_id: user.id,
                    court_id: validated.courtId,
                    package_id: validated.packageId,
                    start_time: new Date(validated.startTime).toISOString(),
                    end_time: new Date(endTime).toISOString(),
                    status: 'pending',
                    total_amount: 0, // Calculate based on package
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
                error: error.message || 'Đặt sân thất bại',
            };
        }
    }

    async getActiveBooking(): Promise<ApiResponse<Booking | null>> {
        try {
            const { data: { user }, error: authError } = await apiClient.supabase.auth.getUser();
            if (authError || !user) {
                throw createApiError(ErrorCode.AUTH_UNAUTHORIZED);
            }

            const { data, error } = await apiClient.supabase
                .from('bookings')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            return {
                success: true,
                data: data || null,
            };
        } catch (error: any) {
            return {
                success: false,
                data: null,
                error: error.message || 'Không thể lấy booking',
            };
        }
    }

    async cancelBooking(bookingId: string, reason?: string): Promise<ApiResponse<boolean>> {
        try {
            const { error } = await apiClient.supabase
                .from('bookings')
                .update({
                    status: 'cancelled',
                    cancellation_reason: reason,
                })
                .eq('id', bookingId);

            if (error) throw error;

            return {
                success: true,
                data: true,
            };
        } catch (error: any) {
            return {
                success: false,
                data: false,
                error: error.message || 'Hủy booking thất bại',
            };
        }
    }

    async getBookingHistory(limit = 50): Promise<ApiResponse<Booking[]>> {
        try {
            const { data: { user }, error: authError } = await apiClient.supabase.auth.getUser();
            if (authError || !user) {
                throw createApiError(ErrorCode.AUTH_UNAUTHORIZED);
            }

            const { data, error } = await apiClient.supabase
                .from('bookings')
                .select('*')
                .eq('user_id', user.id)
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
                error: error.message || 'Không thể lấy lịch sử booking',
            };
        }
    }

    async checkInBooking(bookingId: string): Promise<ApiResponse<boolean>> {
        try {
            const { error } = await apiClient.supabase
                .from('bookings')
                .update({
                    status: 'active',
                    actual_start_time: new Date().toISOString(),
                })
                .eq('id', bookingId);

            if (error) throw error;

            return {
                success: true,
                data: true,
            };
        } catch (error: any) {
            return {
                success: false,
                data: false,
                error: error.message || 'Check-in thất bại',
            };
        }
    }

    async rescheduleBooking(bookingId: string, newStartTime: number): Promise<ApiResponse<Booking>> {
        try {
            const { data: booking, error: fetchError } = await apiClient.supabase
                .from('bookings')
                .select('*')
                .eq('id', bookingId)
                .single();

            if (fetchError || !booking) {
                throw createApiError(ErrorCode.BOOKING_NOT_FOUND);
            }

            const duration = new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime();
            const newEndTime = newStartTime + duration;

            const { data, error } = await apiClient.supabase
                .from('bookings')
                .update({
                    start_time: new Date(newStartTime).toISOString(),
                    end_time: new Date(newEndTime).toISOString(),
                })
                .eq('id', bookingId)
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                data: data,
            };
        } catch (error: any) {
            return {
                success: false,
                data: null as any,
                error: error.message || 'Đổi lịch thất bại',
            };
        }
    }

    async endBooking(bookingId?: string): Promise<ApiResponse<boolean>> {
        try {
            const { data: { user }, error: authError } = await apiClient.supabase.auth.getUser();
            if (authError || !user) {
                throw createApiError(ErrorCode.AUTH_UNAUTHORIZED);
            }

            let targetBookingId = bookingId;

            if (!targetBookingId) {
                const activeBooking = await this.getActiveBooking();
                if (!activeBooking.success || !activeBooking.data) {
                    throw createApiError(ErrorCode.BOOKING_NOT_FOUND);
                }
                targetBookingId = activeBooking.data.id;
            }

            const { error } = await apiClient.supabase
                .from('bookings')
                .update({
                    status: 'completed',
                    actual_end_time: new Date().toISOString(),
                })
                .eq('id', targetBookingId);

            if (error) throw error;

            return {
                success: true,
                data: true,
            };
        } catch (error: any) {
            return {
                success: false,
                data: false,
                error: error.message || 'Kết thúc booking thất bại',
            };
        }
    }

    async getUpcomingBooking(courtId?: string): Promise<ApiResponse<Booking | null>> {
        try {
            const { data: { user }, error: authError } = await apiClient.supabase.auth.getUser();
            if (authError || !user) {
                throw createApiError(ErrorCode.AUTH_UNAUTHORIZED);
            }

            let query = apiClient.supabase
                .from('bookings')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'pending')
                .gte('start_time', new Date().toISOString())
                .order('start_time', { ascending: true })
                .limit(1);

            if (courtId) {
                query = query.eq('court_id', courtId);
            }

            const { data, error } = await query.single();

            if (error && error.code !== 'PGRST116') throw error;

            return {
                success: true,
                data: data || null,
            };
        } catch (error: any) {
            return {
                success: false,
                data: null,
                error: error.message || 'Không thể lấy booking sắp tới',
            };
        }
    }
}

export const bookingsService = new BookingsService();
