
import { supabase } from '../lib/supabase';
import { User, Court, Highlight, Package, Booking, ApiResponse } from '../types';

// Fallback user for when Auth fails or during development without env vars
const MOCK_USER: User = {
  id: 'mock_u1',
  name: 'Khách (Demo)',
  avatar: 'https://picsum.photos/id/64/200/200',
  phone: '0987654321',
  totalHighlights: 0,
  hoursPlayed: 0,
  courtsVisited: 0,
  credits: 0,
  membershipTier: 'free'
};

export const ApiService = {
  // 1. Auth & User
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return { success: false, data: MOCK_USER };
      }

      // Fetch profile from DB
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error || !data) {
        // If profile doesn't exist yet (first login), return basic info
        return { 
          success: true, 
          data: { 
            ...MOCK_USER, 
            id: session.user.id 
          } 
        };
      }

      // Map DB snake_case to CamelCase types
      const user: User = {
        id: data.id,
        name: data.name || 'Người chơi mới',
        avatar: data.avatar || MOCK_USER.avatar,
        phone: data.phone || '',
        totalHighlights: data.total_highlights || 0,
        hoursPlayed: 0, // Tính toán sau
        courtsVisited: 0,
        credits: data.credits || 0,
        membershipTier: data.membership_tier as any || 'free'
      };

      return { success: true, data: user };
    } catch (e) {
      console.error(e);
      return { success: false, data: MOCK_USER };
    }
  },

  // 2. Courts
  getCourts: async (): Promise<ApiResponse<Court[]>> => {
    const { data, error } = await supabase.from('courts').select('*');
    
    if (error) {
      console.error(error);
      return { success: false, data: [] };
    }

    const courts: Court[] = data.map((c: any) => ({
      id: c.id,
      name: c.name,
      address: c.address,
      status: c.status,
      thumbnailUrl: c.thumbnail_url,
      distanceKm: Number((Math.random() * 5).toFixed(1)), // Fake distance for now
      pricePerHour: c.price_per_hour,
      rating: 4.5
    }));

    return { success: true, data: courts };
  },

  getCourtById: async (id: string): Promise<ApiResponse<Court | undefined>> => {
    const { data, error } = await supabase.from('courts').select('*').eq('id', id).single();
    if (error) return { success: false, data: undefined };
    
    return { 
      success: true, 
      data: {
        id: data.id,
        name: data.name,
        address: data.address,
        status: data.status,
        thumbnailUrl: data.thumbnail_url,
        distanceKm: 1.2,
        pricePerHour: data.price_per_hour,
        rating: 4.5
      }
    };
  },

  getPackages: async (): Promise<ApiResponse<Package[]>> => {
    const { data, error } = await supabase.from('packages').select('*');
    if (error) return { success: false, data: [] };

    return { 
      success: true, 
      data: data.map((p: any) => ({
        id: p.id,
        name: p.name,
        durationMinutes: p.duration_minutes,
        price: p.price,
        description: p.description,
        isBestValue: p.is_best_value
      }))
    };
  },

  // 3. Bookings
  createBooking: async (packageId: string, courtId: string): Promise<ApiResponse<Booking>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get package details for price
    const { data: pkg } = await supabase.from('packages').select('*').eq('id', packageId).single();
    
    if (!pkg) throw new Error('Package not found');

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + pkg.duration_minutes * 60000);

    const { data, error } = await supabase.from('bookings').insert({
      user_id: user.id,
      court_id: courtId,
      package_id: packageId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      total_amount: pkg.price,
      status: 'active'
    }).select().single();

    if (error) throw error;

    // Deduct credits locally (Optimistic) - In real app, use Database Trigger
    // For MVP, we assume success

    return {
      success: true,
      data: {
        id: data.id,
        userId: data.user_id,
        courtId: data.court_id,
        packageId: data.package_id,
        startTime: new Date(data.start_time).getTime(),
        endTime: new Date(data.end_time).getTime(),
        status: data.status,
        totalAmount: data.total_amount
      }
    };
  },

  getActiveBooking: async (): Promise<ApiResponse<Booking | null>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, data: null };

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return { success: true, data: null };

    const endTime = new Date(data.end_time).getTime();
    if (Date.now() > endTime) {
        // Auto expire logic would happen on server, but we handle UI here
        return { success: true, data: null };
    }

    return {
      success: true,
      data: {
        id: data.id,
        userId: data.user_id,
        courtId: data.court_id,
        packageId: data.package_id,
        startTime: new Date(data.start_time).getTime(),
        endTime: endTime,
        status: data.status,
        totalAmount: data.total_amount
      }
    };
  },

  endBooking: async (): Promise<ApiResponse<boolean>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, data: false };

    // Update most recent active booking
    await supabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('user_id', user.id)
      .eq('status', 'active');

    return { success: true, data: true };
  },

  // 4. Highlights
  getHighlights: async (limit = 10): Promise<ApiResponse<Highlight[]>> => {
    const { data, error } = await supabase
      .from('highlights')
      .select(`
        *,
        court:courts(name),
        profile:profiles(name, avatar)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return { success: false, data: [] };

    const highlights: Highlight[] = data.map((h: any) => ({
      id: h.id,
      userId: h.user_id,
      courtId: h.court_id,
      thumbnailUrl: h.thumbnail_url || 'https://picsum.photos/400/800', // Fallback
      videoUrl: h.video_url,
      durationSec: h.duration_sec,
      createdAt: h.created_at,
      likes: h.likes,
      views: h.views,
      courtName: h.court?.name || 'Unknown Court',
      userAvatar: h.profile?.avatar || 'https://picsum.photos/200',
      userName: h.profile?.name || 'User',
      isLiked: false
    }));

    return { success: true, data: highlights };
  },

  createHighlight: async (courtId: string): Promise<ApiResponse<Highlight>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // In a real app, this triggers a Cloudflare Stream Clip creation.
    // For MVP, we insert a record pointing to a sample Cloudflare video or dummy URL.
    
    const { data, error } = await supabase.from('highlights').insert({
        user_id: user.id,
        court_id: courtId,
        thumbnail_url: `https://picsum.photos/400/800?random=${Date.now()}`,
        video_url: 'https://customer-w42898.cloudflarestream.com/sample/manifest/video.m3u8', // Demo Stream
        duration_sec: 30,
        likes: 0,
        views: 0
    }).select().single();

    if (error) throw error;

    // Increment profile stats
    // await supabase.rpc('increment_highlight_count', { user_id: user.id });

    return { success: true, data: data as any }; // Simplified type mapping
  }
};
