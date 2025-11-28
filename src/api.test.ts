import { describe, it, expect, beforeEach, vi } from 'vitest';

// IMPORTANT: Mock MUST be at the top, before any imports that use it
vi.mock('../lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user: { id: 'test-user-id', email: 'test@test.com' } },
                error: null,
            }),
        },
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
                getPublicUrl: vi.fn().mockReturnValue({
                    data: { publicUrl: 'https://test.com/test.jpg' }
                }),
            })),
        },
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
}));

// NOW import after mock
import { ApiService } from '../services/api';
import { mockTransaction } from './test/testUtils';
import { supabase } from '../lib/supabase';

describe('ApiService - Transaction Methods', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getTransactionHistory', () => {
        it('should fetch transaction history successfully', async () => {
            // Arrange
            const mockTransactions = [
                mockTransaction,
                { ...mockTransaction, id: 'transaction-456' },
            ];

            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({
                    data: mockTransactions,
                    error: null,
                }),
            } as any);

            // Act
            const result = await ApiService.getTransactionHistory(50);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
            expect(result.data[0].id).toBe('transaction-123');
            expect(supabase.from).toHaveBeenCalledWith('transactions');
        });

        it('should handle database errors gracefully', async () => {
            // Arrange
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Database connection failed' },
                }),
            } as any);

            // Act
            const result = await ApiService.getTransactionHistory(50);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.data).toEqual([]);
        });

        it('should respect the limit parameter', async () => {
            // Arrange
            const limit = 20;
            const mockLimitFn = vi.fn().mockResolvedValue({
                data: [],
                error: null,
            });

            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: mockLimitFn,
            } as any);

            // Act
            await ApiService.getTransactionHistory(limit);

            // Assert
            expect(mockLimitFn).toHaveBeenCalledWith(limit);
        });

        it('should order transactions by created_at descending', async () => {
            // Arrange
            const mockOrderFn = vi.fn().mockReturnThis();

            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: mockOrderFn,
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            } as any);

            // Act
            await ApiService.getTransactionHistory(50);

            // Assert
            expect(mockOrderFn).toHaveBeenCalledWith('created_at', { ascending: false });
        });

        it('should filter transactions by current user', async () => {
            // Arrange
            const mockEqFn = vi.fn().mockReturnThis();

            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: mockEqFn,
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            } as any);

            // Act
            await ApiService.getTransactionHistory(50);

            // Assert
            expect(mockEqFn).toHaveBeenCalledWith('user_id', 'test-user-id');
        });
    });

    describe('getTransactionSummary', () => {
        it('should call get_transaction_summary RPC function', async () => {
            // Arrange
            const mockSummary = {
                total_credits_purchased: 500000,
                total_spent: 300000,
                total_refunded: 50000,
                transaction_count: 25,
            };

            vi.mocked(supabase.rpc).mockResolvedValue({
                data: [mockSummary],
                error: null,
            } as any);

            // Act
            const result = await ApiService.getTransactionSummary();

            // Assert
            expect(result.success).toBe(true);
            expect(result.data.total_credits_purchased).toBe(500000);
            expect(supabase.rpc).toHaveBeenCalledWith('get_transaction_summary', {
                p_user_id: 'test-user-id',
            });
        });

        it('should return null for empty result', async () => {
            // Arrange
            vi.mocked(supabase.rpc).mockResolvedValue({
                data: [],
                error: null,
            } as any);

            // Act
            const result = await ApiService.getTransactionSummary();

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBeNull();
        });

        it('should handle RPC errors', async () => {
            // Arrange
            vi.mocked(supabase.rpc).mockResolvedValue({
                data: null,
                error: { message: 'Function not found' },
            } as any);

            // Act
            const result = await ApiService.getTransactionSummary();

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Function not found');
        });
    });

    describe('processTopUp', () => {
        it('should update credits and create transaction record', async () => {
            // Arrange
            const transactionId = 'vnpay-12345';
            const amount = 100000;
            const method = 'vnpay';
            const currentCredits = 50000;

            const mockInsertFn = vi.fn().mockResolvedValue({
                data: {},
                error: null,
            });

            const mockUpdateFn = vi.fn().mockReturnThis();

            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: { credits: currentCredits },
                    error: null,
                }),
                update: mockUpdateFn,
                insert: mockInsertFn,
            } as any);

            // Act
            const result = await ApiService.processTopUp(transactionId, amount, method);

            // Assert
            expect(result.success).toBe(true);

            // Verify credits were updated
            expect(mockUpdateFn).toHaveBeenCalledWith({
                credits: currentCredits + amount,
            });

            // Verify transaction was created
            expect(mockInsertFn).toHaveBeenCalled();
            const insertedData = mockInsertFn.mock.calls[0][0];
            expect(insertedData).toMatchObject({
                type: 'credit_purchase',
                amount: amount,
                status: 'completed',
                payment_method: method,
                reference_id: transactionId,
            });
            expect(insertedData.metadata).toHaveProperty('previous_balance', currentCredits);
            expect(insertedData.metadata).toHaveProperty('new_balance', currentCredits + amount);
        });

        it('should still succeed if transaction recording fails', async () => {
            // Arrange: Simulate credits update success but transaction insert fails
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: { credits: 50000 },
                    error: null,
                }),
                update: vi.fn().mockReturnThis(),
                insert: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Transaction table locked' },
                }),
            } as any);

            // Act
            const result = await ApiService.processTopUp('test', 100000, 'vnpay');

            // Assert: Should still return success because credits were added
            expect(result.success).toBe(true);
        });

        it('should fail if user not found', async () => {
            // Arrange
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'User not found' },
                }),
            } as any);

            // Act
            const result = await ApiService.processTopUp('test', 100000, 'vnpay');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('User not found');
        });
    });
});
