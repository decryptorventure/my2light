import { supabase } from '../lib/supabase';
import {
    SocialProfile,
    SocialConnection,
    Activity,
    HighlightInteraction,
    HighlightComment,
    ApiResponse
} from '../types/social';

export const SocialService = {
    // --- Follow System ---

    async followPlayer(targetUserId: string): Promise<ApiResponse<void>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Check if already connected or pending
            const { data: existing } = await supabase
                .from('player_connections')
                .select('*')
                .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .or(`requester_id.eq.${targetUserId},receiver_id.eq.${targetUserId}`)
                .single();

            if (existing) {
                if (existing.status === 'accepted') return { success: false, error: 'Already connected' };
                if (existing.status === 'pending') return { success: false, error: 'Request pending' };
            }

            // Create connection request
            const { error } = await supabase
                .from('player_connections')
                .insert({
                    requester_id: user.id,
                    receiver_id: targetUserId,
                    status: 'pending'
                });

            if (error) throw error;

            // Create notification (activity) for target user
            await this.createActivity({
                user_id: targetUserId,
                activity_type: 'new_follower',
                metadata: { follower_id: user.id }
            });

            return { success: true };
        } catch (error: any) {
            console.error('Error following player:', error);
            return { success: false, error: error.message };
        }
    },

    async unfollowPlayer(targetUserId: string): Promise<ApiResponse<void>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('player_connections')
                .delete()
                .or(`and(requester_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},receiver_id.eq.${user.id})`);

            if (error) throw error;

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    async getConnections(userId: string, status: 'accepted' | 'pending' = 'accepted'): Promise<ApiResponse<SocialConnection[]>> {
        try {
            const { data, error } = await supabase
                .from('player_connections')
                .select(`
                    *,
                    requester:profiles!requester_id(id, full_name, avatar_url, skill_level),
                    receiver:profiles!receiver_id(id, full_name, avatar_url, skill_level)
                `)
                .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
                .eq('status', status);

            if (error) throw error;

            // Transform to friendly format
            const connections = data.map(conn => {
                const isRequester = conn.requester_id === userId;
                const otherUser = isRequester ? conn.receiver : conn.requester;
                return {
                    id: conn.id,
                    userId: otherUser.id,
                    name: otherUser.full_name,
                    avatar: otherUser.avatar_url,
                    skillLevel: otherUser.skill_level,
                    status: conn.status,
                    connectedAt: conn.created_at,
                    isRequester,
                    // Mock data for missing fields
                    membershipTier: 'basic',
                    matchesPlayed: 0,
                    followedAt: conn.created_at
                } as SocialConnection;
            });

            return { success: true, data: connections };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    async getPendingRequests(): Promise<ApiResponse<SocialConnection[]>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('player_connections')
                .select(`
                    *,
                    requester:profiles!requester_id(id, full_name, avatar_url, skill_level)
                `)
                .eq('receiver_id', user.id)
                .eq('status', 'pending');

            if (error) throw error;

            const requests = data.map(conn => ({
                id: conn.id,
                userId: conn.requester.id,
                name: conn.requester.full_name,
                avatar: conn.requester.avatar_url,
                skillLevel: conn.requester.skill_level,
                status: conn.status,
                connectedAt: conn.created_at,
                isRequester: false,
                membershipTier: 'basic',
                matchesPlayed: 0,
                followedAt: conn.created_at
            } as SocialConnection));

            return { success: true, data: requests };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    async acceptRequest(connectionId: string): Promise<ApiResponse<void>> {
        try {
            const { error } = await supabase
                .from('player_connections')
                .update({ status: 'accepted', updated_at: new Date().toISOString() })
                .eq('id', connectionId);

            if (error) throw error;

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    // --- Activity Feed ---

    async getFeed(page: number = 1, limit: number = 10): Promise<ApiResponse<Activity[]>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Get list of followed users
            const { data: connections } = await supabase
                .from('player_connections')
                .select('requester_id, receiver_id')
                .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .eq('status', 'accepted');

            const friendIds = connections?.map(c =>
                c.requester_id === user.id ? c.receiver_id : c.requester_id
            ) || [];

            // Include self
            friendIds.push(user.id);

            const from = (page - 1) * limit;
            const to = from + limit - 1;

            // Get activities from friends
            const { data, error } = await supabase
                .from('player_activities')
                .select(`
                    *,
                    user:profiles!user_id(id, full_name, avatar_url)
                `)
                .in('user_id', friendIds)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            return { success: true, data: data as Activity[] };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    async createActivity(activity: Partial<Activity>): Promise<void> {
        try {
            await supabase.from('player_activities').insert(activity);
        } catch (error) {
            console.error('Error creating activity:', error);
        }
    },

    // --- Interactions ---

    async likeHighlight(highlightId: string): Promise<ApiResponse<void>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // 1. Record interaction
            const { error } = await supabase
                .from('highlight_interactions')
                .insert({
                    highlight_id: highlightId,
                    user_id: user.id,
                    type: 'like'
                });

            if (error) {
                if (error.code === '23505') { // Unique violation (already liked)
                    return { success: true };
                }
                throw error;
            }

            // 2. Increment likes count on highlight
            // Note: In a real app, this should be a database trigger or RPC
            const { data: highlight } = await supabase
                .from('highlights')
                .select('likes')
                .eq('id', highlightId)
                .single();

            if (highlight) {
                await supabase
                    .from('highlights')
                    .update({ likes: (highlight.likes || 0) + 1 })
                    .eq('id', highlightId);
            }

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    async unlikeHighlight(highlightId: string): Promise<ApiResponse<void>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // 1. Remove interaction
            const { error } = await supabase
                .from('highlight_interactions')
                .delete()
                .match({
                    highlight_id: highlightId,
                    user_id: user.id,
                    type: 'like'
                });

            if (error) throw error;

            // 2. Decrement likes count
            const { data: highlight } = await supabase
                .from('highlights')
                .select('likes')
                .eq('id', highlightId)
                .single();

            if (highlight) {
                await supabase
                    .from('highlights')
                    .update({ likes: Math.max(0, (highlight.likes || 0) - 1) })
                    .eq('id', highlightId);
            }

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    async addComment(highlightId: string, content: string): Promise<ApiResponse<HighlightComment>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('highlight_comments')
                .insert({
                    highlight_id: highlightId,
                    user_id: user.id,
                    comment: content
                })
                .select(`
                    *,
                    user:profiles!user_id(id, full_name, avatar_url)
                `)
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    async getComments(highlightId: string): Promise<ApiResponse<HighlightComment[]>> {
        try {
            const { data, error } = await supabase
                .from('highlight_comments')
                .select(`
                    *,
                    user:profiles!user_id(id, full_name, avatar_url)
                `)
                .eq('highlight_id', highlightId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            return { success: true, data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    // --- Discovery ---

    async getSuggestedPlayers(): Promise<ApiResponse<SocialProfile[]>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Simple algorithm: Get users not connected to current user
            // In real app, use more complex logic (skill level, location, mutual friends)

            // Get connected IDs
            const { data: connections } = await supabase
                .from('player_connections')
                .select('requester_id, receiver_id')
                .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

            const connectedIds = new Set(connections?.map(c =>
                c.requester_id === user.id ? c.receiver_id : c.requester_id
            ) || []);
            connectedIds.add(user.id);

            // Fetch profiles not in connectedIds
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'player') // Only suggest players
                .limit(20);

            if (error) throw error;

            const suggestions = data
                .filter(p => !connectedIds.has(p.id))
                .map(p => ({
                    id: p.id,
                    fullName: p.full_name,
                    avatarUrl: p.avatar_url,
                    skillLevel: p.skill_level,
                    bio: p.bio,
                    followersCount: p.followers_count || 0,
                    followingCount: p.following_count || 0,
                    isFollowing: false
                }));

            return { success: true, data: suggestions };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    async getPlayerProfile(userId: string): Promise<ApiResponse<SocialProfile>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const currentUserId = user?.id;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            // Check if following
            let isFollowing = false;
            if (currentUserId) {
                const { data: connection } = await supabase
                    .from('player_connections')
                    .select('status')
                    .or(`and(requester_id.eq.${currentUserId},receiver_id.eq.${userId}),and(requester_id.eq.${userId},receiver_id.eq.${currentUserId})`)
                    .eq('status', 'accepted')
                    .single();
                isFollowing = !!connection;
            }

            return {
                success: true,
                data: {
                    id: data.id,
                    fullName: data.full_name,
                    avatarUrl: data.avatar_url,
                    skillLevel: data.skill_level,
                    bio: data.bio,
                    followersCount: data.followers_count || 0,
                    followingCount: data.following_count || 0,
                    isFollowing
                }
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
};
