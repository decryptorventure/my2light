import { apiClient } from '../../core/client';
import { ApiResponse } from '../../core/types';
import { createApiError, ErrorCode } from '../../core/errorHandler';
import { TopUpSchema, TopUpInput } from './payments.schema';
import { Transaction } from './payments.types';

class PaymentsService {
    async processTopUp(topUpData: TopUpInput): Promise<ApiResponse<Transaction>> {
        try {
            const validated = TopUpSchema.parse(topUpData);

            const { data: { user }, error: authError } = await apiClient.supabase.auth.getUser();
            if (authError || !user) {
                throw createApiError(ErrorCode.AUTH_UNAUTHORIZED);
            }

            const transactionId = crypto.randomUUID();

            const { data, error } = await apiClient.supabase
                .from('transactions')
                .insert({
                    id: transactionId,
                    user_id: user.id,
                    type: 'top_up',
                    amount: validated.amount,
                    method: validated.method,
                    status: 'pending',
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
                error: error.message || 'Nạp tiền thất bại',
            };
        }
    }

    async getTransactionHistory(limit = 50): Promise<ApiResponse<Transaction[]>> {
        try {
            const { data: { user }, error: authError } = await apiClient.supabase.auth.getUser();
            if (authError || !user) {
                throw createApiError(ErrorCode.AUTH_UNAUTHORIZED);
            }

            const { data, error } = await apiClient.supabase
                .from('transactions')
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
                error: error.message || 'Không thể lấy lịch sử giao dịch',
            };
        }
    }

    async getBalance(): Promise<ApiResponse<number>> {
        try {
            const { data: { user }, error: authError } = await apiClient.supabase.auth.getUser();
            if (authError || !user) {
                throw createApiError(ErrorCode.AUTH_UNAUTHORIZED);
            }

            const { data, error } = await apiClient.supabase
                .from('profiles')
                .select('credits')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            return {
                success: true,
                data: data?.credits || 0,
            };
        } catch (error: any) {
            return {
                success: false,
                data: 0,
                error: error.message || 'Không thể lấy số dư',
            };
        }
    }
}

export const paymentsService = new PaymentsService();
