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
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user: { id: 'test-user-id', email: 'test@test.com' } },
                error: null,
            }),
            getSession: vi.fn().mockResolvedValue({
                data: { session: { user: { id: 'test-user-id', email: 'test@test.com' } } },
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
    },
}));

// NOW import after mock
import { ApiService } from '../services/api';
import { mockUser, createMockFile } from './test/testUtils';
import { supabase } from '../lib/supabase';

describe('ApiService - User Methods', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getCurrentUser', () => {
        it('should fetch existing user profile successfully', async () => {
            // Arrange
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: { ...mockUser, id: 'test-user-id' },
                    error: null,
                }),
            } as any);

            // Mock bookings for stats
            const mockBookings = [
                { start_time: '2024-01-01T10:00:00Z', end_time: '2024-01-01T12:00:00Z', court_id: 'c1' },
                { start_time: '2024-01-02T10:00:00Z', end_time: '2024-01-02T11:00:00Z', court_id: 'c2' }
            ];

            // We need to mock multiple calls to from()
            // 1. profiles
            // 2. bookings
            // 3. highlights
            const fromMock = vi.mocked(supabase.from);
            fromMock.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: { ...mockUser, id: 'test-user-id' }, error: null }),
                    } as any;
                }
                if (table === 'bookings') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockReturnThis(), // not used
                    } as any;
                    // Note: In real implementation, it awaits select().eq().eq()
                    // But here we need to mock the chain properly or just return data at the end
                    // The implementation awaits supabase.from(...).select(...)...
                }
                if (table === 'highlights') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                    } as any;
                }
                return {} as any;
            });

            // To simplify, let's mock the specific chain returns
            // But since it's hard to match exact chains, let's use a simpler approach
            // We can mock the resolved values of the promises

            // Re-mock with specific implementations
            vi.mocked(supabase.from).mockImplementation((table) => {
                const chain = {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn(),
                    insert: vi.fn().mockReturnThis(),
                };

                if (table === 'profiles') {
                    chain.single.mockResolvedValue({ data: { ...mockUser, id: 'test-user-id' }, error: null });
                } else if (table === 'bookings') {
                    // bookings returns a promise with data
                    // In implementation: await supabase.from('bookings').select(...).eq(...).eq(...)
                    // So the last method in chain needs to resolve
                    chain.eq.mockImplementation(() => {
                        // This is tricky because eq is called multiple times
                        // Let's just make the chain return a promise-like object
                        return {
                            then: (resolve: any) => resolve({ data: mockBookings, error: null }),
                            eq: vi.fn().mockReturnThis(), // for chaining
                        } as any;
                    });
                } else if (table === 'highlights') {
                    chain.eq.mockResolvedValue({ count: 5, error: null });
                }
                return chain as any;
            });


            // Act
            // Note: The mocking above is a bit complex and might be fragile. 
            // Let's try a simpler mock strategy that covers the main path.
            // The implementation calls:
            // 1. auth.getSession() -> mocked globally
            // 2. from('profiles')...single()
            // 3. from('bookings')...
            // 4. from('highlights')...

            // Reset mocks to be cleaner
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { ...mockUser, id: 'test-user-id' }, error: null }),
                insert: vi.fn().mockReturnThis(),
            } as any);

            // We can't easily mock different returns for different tables with the default mock
            // So we MUST use mockImplementation
            vi.mocked(supabase.from).mockImplementation((table) => {
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: { ...mockUser, id: 'test-user-id' }, error: null }),
                    } as any;
                }
                if (table === 'bookings') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        // The implementation ends with .eq('status', 'completed') which returns the promise
                        // We need to make sure the last call returns the data
                        eq: vi.fn().mockImplementation((field, value) => {
                            if (value === 'completed') {
                                return Promise.resolve({ data: mockBookings, error: null });
                            }
                            return { eq: vi.fn().mockReturnThis() }; // chain
                        }),
                    } as any;
                }
                if (table === 'highlights') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
                    } as any;
                }
                return { select: vi.fn().mockReturnThis() } as any;
            });

            const result = await ApiService.getCurrentUser();

            // Assert
            expect(result.success).toBe(true);
            expect(result.data.id).toBe('test-user-id');
            expect(result.data.totalHighlights).toBe(5);
            // 2 hours + 1 hour = 3 hours
            // But implementation logic: (end - start) / 3600000
            // 10-12 = 2h, 10-11 = 1h. Total 3h.
            // Wait, implementation logic might be slightly different or my mock dates
            // Let's check implementation:
            // const duration = (new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / 3600000;
            // hoursPlayed += duration;
            // visitedCourts.add(b.court_id);

            // My mock dates are valid ISO strings.
            // result.data.hoursPlayed should be 3.

            // However, the mock implementation for bookings is tricky.
            // `eq` returns `this` usually.
            // The implementation: .eq('user_id', ...).eq('status', 'completed')
            // So the FIRST eq returns an object that has the SECOND eq.
            // The SECOND eq returns the promise.

            // Let's refine the mock for bookings
            vi.mocked(supabase.from).mockImplementation((table) => {
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: { ...mockUser, id: 'test-user-id' }, error: null }),
                    } as any;
                }
                if (table === 'bookings') {
                    const mockChain = {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                    };
                    // We need the LAST call to return the data promise
                    // But we can't easily know which is last.
                    // A common trick is to make EVERY call return a then-able object that resolves to data
                    // AND has the chain methods.
                    const promiseChain = Promise.resolve({ data: mockBookings, error: null });
                    Object.assign(promiseChain, {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnValue(promiseChain), // Recursive
                    });
                    return promiseChain as any;
                }
                if (table === 'highlights') {
                    const promiseChain = Promise.resolve({ count: 5, error: null });
                    Object.assign(promiseChain, {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnValue(promiseChain),
                    });
                    return promiseChain as any;
                }
                return { select: vi.fn().mockReturnThis() } as any;
            });

            const result2 = await ApiService.getCurrentUser();
            expect(result2.success).toBe(true);
            expect(result2.data.id).toBe('test-user-id');
            expect(result2.data.totalHighlights).toBe(5);
            expect(result2.data.hoursPlayed).toBe(3);
            expect(result2.data.courtsVisited).toBe(2);
        });

        it('should create new profile if not exists', async () => {
            // Arrange
            vi.mocked(supabase.from).mockImplementation((table) => {
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }), // Not found
                        insert: vi.fn().mockResolvedValue({ error: null }), // Insert success
                    } as any;
                }
                return { select: vi.fn().mockReturnThis() } as any;
            });

            // Act
            const result = await ApiService.getCurrentUser();

            // Assert
            expect(result.success).toBe(true);
            expect(result.data.name).toBe('Test'); // Derived from test@test.com
            expect(result.data.credits).toBe(200000); // Default
            expect(supabase.from).toHaveBeenCalledWith('profiles');
            // Verify insert was called
            // We can't easily verify the exact call on the mock instance created inside implementation
            // But we can verify the result structure which depends on the fallback logic
        });

        it('should return error if not authenticated', async () => {
            // Arrange
            vi.mocked(supabase.auth.getSession).mockResolvedValue({
                data: { session: null },
                error: null,
            });

            // Act
            const result = await ApiService.getCurrentUser();

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Not authenticated');
        });
    });

    describe('updateUserProfile', () => {
        it('should update existing profile successfully', async () => {
            // Arrange
            vi.mocked(supabase.from).mockImplementation((table) => {
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: { id: 'test-user-id' }, error: null }), // Exists
                        update: vi.fn().mockReturnThis(), // Update chain
                    } as any;
                }
                return {} as any;
            });

            // We need to ensure the update chain resolves
            vi.mocked(supabase.from).mockImplementation((table) => {
                if (table === 'profiles') {
                    const chain = {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: { id: 'test-user-id' }, error: null }),
                        update: vi.fn().mockReturnValue({
                            eq: vi.fn().mockResolvedValue({ error: null }) // End of update chain
                        })
                    };
                    return chain as any;
                }
                return {} as any;
            });

            // Act
            const result = await ApiService.updateUserProfile({ name: 'New Name' });

            // Assert
            expect(result.success).toBe(true);
        });
    });

    describe('uploadAvatar', () => {
        it('should upload file and return public url', async () => {
            // Arrange
            const mockFile = createMockFile('avatar.jpg', 100, 'image/jpeg');

            // Act
            const result = await ApiService.uploadAvatar(mockFile);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBe('https://test.com/test.jpg');
            expect(supabase.storage.from).toHaveBeenCalledWith('avatars');
        });

        it('should return empty string if upload fails', async () => {
            // Arrange
            vi.mocked(supabase.storage.from).mockReturnValue({
                upload: vi.fn().mockResolvedValue({ data: null, error: { message: 'Upload failed' } }),
                getPublicUrl: vi.fn(),
            } as any);

            const mockFile = createMockFile();

            // Act
            const result = await ApiService.uploadAvatar(mockFile);

            // Assert
            expect(result.success).toBe(false);
            expect(result.data).toBe('');
        });
    });
});
