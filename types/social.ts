// Social Network Type Definitions
// Corresponds to database schema in migrations/004_analytics_social.sql

// =====================================================
// Common Types
// =====================================================

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// =====================================================
// Player Connections (Follow/Friend System)
// =====================================================

export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

export interface PlayerConnection {
    id: string;
    requesterId: string;
    receiverId: string;
    status: ConnectionStatus;
    message?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ConnectionRequest extends PlayerConnection {
    requesterName: string;
    requesterAvatar?: string;
    requesterPlayingStyle?: string;
}

export interface Connection {
    id: string;
    userId: string;
    name: string;
    avatar?: string;
    playingStyle?: string;
    membershipTier: string;
    matchesPlayed: number;
    followedAt: string;
    mutualFriendsCount?: number;
    // UI helpers
    skillLevel?: string;
    isRequester?: boolean;
    status?: ConnectionStatus;
}

// Alias for compatibility
export type SocialConnection = Connection;

// =====================================================
// Highlight Interactions
// =====================================================

export type InteractionType = 'like' | 'view' | 'share';

export interface HighlightInteraction {
    id: string;
    highlightId: string;
    userId: string;
    interactionType: InteractionType;
    createdAt: string;
}

export interface HighlightStats {
    likesCount: number;
    viewsCount: number;
    sharesCount: number;
    commentsCount: number;
    isLikedByMe: boolean;
}

// =====================================================
// Comments
// =====================================================

export interface HighlightComment {
    id: string;
    highlightId: string;
    userId: string;
    userName?: string; // Optional if joined
    userAvatar?: string; // Optional if joined
    user?: { // For joined data
        id: string;
        full_name: string;
        avatar_url: string;
    };
    comment: string;
    parentId?: string; // For nested replies
    likesCount?: number;
    createdAt: string;
    updatedAt?: string;
    isLikedByMe?: boolean;
    replies?: HighlightComment[]; // Nested replies
}

export interface CommentInput {
    highlightId: string;
    comment: string;
    parentId?: string;
}

// =====================================================
// Activity Feed
// =====================================================

export type ActivityType =
    | 'highlight_posted'
    | 'match_completed'
    | 'badge_unlocked'
    | 'new_connection'
    | 'court_review'
    | 'new_follower'
    | 'highlight_post'; // Legacy/Alternative

export interface PlayerActivity {
    id: string;
    user_id: string; // DB column name
    activity_type: ActivityType; // DB column name
    metadata: any; // Flexible metadata
    created_at: string; // DB column name
    user?: {
        id: string;
        full_name: string;
        avatar_url: string;
    };
}

// Alias for compatibility
export type Activity = PlayerActivity;

// =====================================================
// Player Profile (Extended)
// =====================================================

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'pro';
export type ProfileVisibility = 'public' | 'connections' | 'private';

export interface PlayerProfilePublic {
    id: string;
    name: string;
    avatar?: string;
    bio?: string;
    playingStyle?: string;
    skillLevel?: SkillLevel;
    membershipTier: string;
    profileVisibility: ProfileVisibility;
    showStats: boolean;

    // Stats (if showStats = true)
    matchesPlayed: number;
    totalHours: number;
    highlightsCount: number;

    // Social counts
    followersCount: number;
    followingCount: number;

    // Connection status with current user
    isFollowing?: boolean;
    isFollower?: boolean;
    connectionStatus?: ConnectionStatus;

    // Timestamps
    createdAt: string;
    lastActiveAt: string;
}

// Alias for compatibility
export interface SocialProfile {
    id: string;
    fullName: string;
    avatarUrl?: string;
    skillLevel?: string;
    bio?: string;
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
}

// =====================================================
// Social Discovery
// =====================================================

export interface PlayerSuggestion {
    userId: string;
    name: string;
    avatar?: string;
    playingStyle?: string;
    skillLevel?: SkillLevel;
    matchCompatibilityScore: number; // 0-100
    mutualFriendsCount: number;
    distanceKm?: number;
    isNearby: boolean;
    isActive: boolean; // Active in last 7 days
    matchesThisMonth: number;
    reason: string; // "Same playing style" | "Nearby" | "Active player"
}

// =====================================================
// Analytics Types
// =====================================================

export interface RevenueDataPoint {
    date: string;
    revenue: number;
    bookingsCount: number;
    averageBookingValue: number;
}

export interface PeakHoursData {
    dayOfWeek: number;
    hour: number;
    bookingsCount: number;
    revenue: number;
}

export interface PeakHoursInsight {
    peakHour: string;
    peakBookings: number;
    slowHour: string;
    slowBookings: number;
    recommendation: string;
    expectedImpact: string;
}

export interface CustomerInsight {
    newCustomers: number;
    returningCustomers: number;
    newVsReturningPercent: {
        new: number;
        returning: number;
    };
    topCustomers: {
        userId: string;
        name: string;
        avatar: string;
        bookingsCount: number;
        totalSpent: number;
        lastBooking: string;
    }[];
    averageBookingFrequency: number;
    averageCustomerLifetimeValue: number;
}

export interface SmartRecommendation {
    id: string;
    type: 'pricing' | 'capacity' | 'marketing' | 'retention' | 'upsell';
    title: string;
    description: string;
    confidence: number;
    expectedImpact: {
        revenue?: number;
        bookings?: number;
        description: string;
    };
    action: {
        label: string;
        type: string;
        data: any;
    };
    isDismissed: boolean;
    isApplied: boolean;
}

export interface CustomerPrediction {
    userId: string;
    userName: string;
    userAvatar: string;
    userPhone: string;
    predictionType: 'likely_to_book' | 'churn_risk' | 'vip_potential';
    probability: number;
    insight: string;
    lastBookingDate: string;
    averageFrequency: number;
    totalBookings: number;
    totalSpent: number;
    suggestedAction: {
        label: string;
        type: string;
        message: string;
    };
}
