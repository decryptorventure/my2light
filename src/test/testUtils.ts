import { vi } from 'vitest';

// Mock Supabase client
export const mockSupabaseClient = {
    from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
        getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'test-user-id', email: 'test@test.com' } },
            error: null,
        }),
        signInWithPassword: vi.fn().mockResolvedValue({
            data: { user: { id: 'test-user-id' }, session: {} },
            error: null,
        }),
        signUp: vi.fn().mockResolvedValue({
            data: { user: { id: 'test-user-id' }, session: {} },
            error: null,
        }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    storage: {
        from: vi.fn(() => ({
            upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
            getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/test.jpg' } }),
            remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
        })),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
};

// Mock user data
export const mockUser = {
    id: 'test-user-123',
    name: 'Test User',
    email: 'test@example.com',
    avatar: 'https://test.com/avatar.jpg',
    phone: '0123456789',
    totalHighlights: 10,
    hoursPlayed: 50.5,
    courtsVisited: 5,
    credits: 100000,
    membershipTier: 'free' as const,
    role: 'player' as const,
};

// Mock court data
export const mockCourt = {
    id: 'court-123',
    name: 'Test Court',
    address: '123 Test St',
    status: 'available' as const,
    thumbnailUrl: 'https://test.com/court.jpg',
    distanceKm: 2.5,
    pricePerHour: 200000,
    rating: 4.5,
    images: ['https://test.com/court1.jpg'],
    facilities: ['Parking', 'Wifi'],
    description: 'Great court for testing',
    openTime: '06:00',
    closeTime: '22:00',
    totalReviews: 100,
};

// Mock highlight data
export const mockHighlight = {
    id: 'highlight-123',
    userId: 'test-user-123',
    courtId: 'court-123',
    thumbnailUrl: 'https://test.com/thumb.jpg',
    videoUrl: 'https://test.com/video.mp4',
    durationSec: 30,
    createdAt: '2024-01-01T00:00:00Z',
    likes: 10,
    views: 100,
    courtName: 'Test Court',
    userAvatar: 'https://test.com/avatar.jpg',
    userName: 'Test User',
    isLiked: false,
    isPublic: true,
    comments: 5,
};

// Mock booking data
export const mockBooking = {
    id: 'booking-123',
    userId: 'test-user-123',
    courtId: 'court-123',
    packageId: 'package-123',
    startTime: Date.now(),
    endTime: Date.now() + 3600000,
    status: 'active' as const,
    totalAmount: 200000,
    courtName: 'Test Court',
    packageName: 'Standard Package',
    packageType: 'standard' as const,
};

// Mock transaction data
export const mockTransaction = {
    id: 'transaction-123',
    user_id: 'test-user-123',
    type: 'credit_purchase' as const,
    amount: 100000,
    status: 'completed' as const,
    payment_method: 'vnpay',
    reference_id: 'ref-123',
    metadata: {
        timestamp: '2024-01-01T00:00:00Z',
        previous_balance: 50000,
        new_balance: 150000,
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
};

// Helper to create mock API response
export const createMockApiResponse = <T>(data: T, success = true) => ({
    success,
    data,
    error: success ? undefined : 'Mock error',
});

// Helper to wait for async updates
export const waitFor = (callback: () => void, timeout = 1000) => {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            try {
                callback();
                clearInterval(interval);
                resolve(true);
            } catch (error) {
                if (Date.now() - startTime > timeout) {
                    clearInterval(interval);
                    reject(error);
                }
            }
        }, 100);
    });
};

// Mock file for upload tests
export const createMockFile = (name = 'test.mp4', size = 1024, type = 'video/mp4') => {
    const blob = new Blob(['test content'], { type });
    return new File([blob], name, { type });
};

// Mock video segment
export const createMockVideoSegment = (index = 0) => ({
    blob: new Blob(['video data'], { type: 'video/webm' }),
    startTime: index * 10,
    endTime: (index + 1) * 10,
    isHighlight: false,
});
