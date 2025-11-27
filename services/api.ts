import { supabase } from '../lib/supabase';
import { User, Court, Highlight, Package, Booking, ApiResponse } from '../types';

export const ApiService = {
  // 1. Auth & User
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        return { success: false, data: null as any, error: 'Not authenticated' };
      }

      // Try fetching profile from DB
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error || !data) {
        // Profile doesn't exist - this shouldn't happen if trigger is working
        // But if it does, create it now
        const emailName = session.user.email?.split('@')[0] || 'User';
        const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);

        const newProfile = {
          id: session.user.id,
          name: displayName,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
          phone: '',
          credits: 200000,
          membership_tier: 'free',
          total_highlights: 0,
          has_onboarded: false
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert(newProfile);

        if (insertError) {
          console.error('Failed to create profile:', insertError);
          return { success: false, data: null as any, error: 'Failed to create profile' };
        }

        // Return the newly created profile
        return {
          success: true,
          data: {
            id: newProfile.id,
            name: newProfile.name,
            avatar: newProfile.avatar,
            phone: newProfile.phone,
            totalHighlights: 0,
            hoursPlayed: 0,
            courtsVisited: 0,
            credits: newProfile.credits,
            membershipTier: 'free'
          }
        };
      }

      const user: User = {
        id: data.id,
        name: data.name || 'Người chơi',
        avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}`,
        phone: data.phone || '',
        totalHighlights: data.total_highlights || 0,
        hoursPlayed: 0, // TODO: Calculate from bookings
        courtsVisited: 0, // TODO: Calculate from bookings
        credits: data.credits || 0,
        membershipTier: (data.membership_tier as any) || 'free'
      };

      return { success: true, data: user };
    } catch (e) {
      console.error('getCurrentUser error:', e);
      return { success: false, data: null as any, error: 'Failed to fetch user' };
    }
  },

  updateUserProfile: async (updates: Partial<{
    name: string;
    phone: string;
    avatar: string;
    credits: number;
    has_onboarded: boolean;
  }>): Promise<ApiResponse<boolean>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, data: false };

    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
    if (updates.credits !== undefined) dbUpdates.credits = updates.credits;
    if (updates.has_onboarded !== undefined) dbUpdates.has_onboarded = updates.has_onboarded;

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', user.id);

    if (error) {
      console.error("Update profile error", error);
      // Try upsert if update failed (maybe profile doesn't exist yet)
      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: user.id,
        ...dbUpdates
      });
      if (upsertError) return { success: false, data: false };
    }
    return { success: true, data: true };
  },

  uploadAvatar: async (file: File): Promise<ApiResponse<string>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, data: '' };

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, data: '' };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return { success: true, data: publicUrl };
  },

  // 2. Courts
  getCourts: async (): Promise<ApiResponse<Court[]>> => {
    try {
      const { data, error } = await supabase.from('courts').select('*');

      if (error || !data) {
        console.error("Error fetching courts:", error);
        return { success: false, data: [] };
      }

      const courts: Court[] = data.map((c: any) => ({
        id: c.id,
        name: c.name,
        address: c.address,
        status: c.status,
        thumbnailUrl: c.thumbnail_url || 'https://images.unsplash.com/photo-1622163642998-1ea36b1dde3b?q=80&w=800&auto=format&fit=crop',
        distanceKm: Number((Math.random() * 5).toFixed(1)), // Mock distance for now
        pricePerHour: c.price_per_hour,
        rating: 4.5 // Mock rating
      }));

      return { success: true, data: courts };
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  getCourtById: async (id: string): Promise<ApiResponse<Court | undefined>> => {
    const { data, error } = await supabase.from('courts').select('*').eq('id', id).single();
    if (error || !data) {
      console.error('getCourtById error:', error);
      return { success: false, data: undefined, error: error?.message || 'Court not found' };
    }

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
    try {
      const { data, error } = await supabase.from('packages').select('*');
      if (error || !data) {
        return { success: false, data: [] };
      }

      return {
        success: true,
        data: data.map((p: any) => ({
          id: p.id,
          name: p.name,
          durationMinutes: p.duration_minutes,
          price: p.price,
          description: p.description,
          isBestValue: p.is_best_value,
          type: p.name.includes('Full') ? 'full_match' : 'standard'
        }))
      };
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  // 3. Bookings
  createBooking: async (packageId: string, courtId: string): Promise<ApiResponse<Booking>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get Package details
    const { data: pkg, error: pkgError } = await supabase.from('packages').select('*').eq('id', packageId).single();
    if (pkgError || !pkg) throw new Error('Package not found');

    const pkgPrice = pkg.price;
    const pkgDuration = pkg.duration_minutes;
    const pkgType = pkg.name.includes('Full') ? 'full_match' : 'standard';

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + pkgDuration * 60000);

    // Check for overlapping bookings on the same court
    // (active bookings that overlap with the requested time window)
    const { data: conflicts, error: conflictError } = await supabase
      .from('bookings')
      .select('id')
      .eq('court_id', courtId)
      .eq('status', 'active')
      .or(`and(start_time.lte.${endTime.toISOString()},end_time.gte.${startTime.toISOString()})`);

    if (conflictError) {
      console.error("Error checking conflicts:", conflictError);
      throw new Error('Could not verify court availability');
    }

    if (conflicts && conflicts.length > 0) {
      throw new Error('Sân này đang có người chơi trong khung giờ này!');
    }

    // Check user has sufficient credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (!profile || profile.credits < pkgPrice) {
      throw new Error(`Không đủ tiền! Bạn cần ${pkgPrice.toLocaleString()}đ nhưng chỉ có ${(profile?.credits || 0).toLocaleString()}đ`);
    }

    const { data, error } = await supabase.from('bookings').insert({
      user_id: user.id,
      court_id: courtId,
      package_id: packageId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      total_amount: pkgPrice,
      status: 'active'
    }).select().single();

    if (error) {
      console.error("Booking error", error);
      throw error;
    }

    // Deduct credits from user profile
    await supabase
      .from('profiles')
      .update({ credits: profile.credits - pkgPrice })
      .eq('id', user.id);

    return {
      success: true,
      data: {
        id: data.id,
        userId: data.user_id,
        courtId: data.court_id,
        packageId: data.package_id,
        startTime: new Date(data.start_time).getTime(),
        endTime: new Date(data.end_time).getTime(),
        status: data.status as any,
        totalAmount: data.total_amount,
        packageType: pkgType
      }
    };
  },

  getActiveBooking: async (): Promise<ApiResponse<Booking | null>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, data: null };

    const { data, error } = await supabase
      .from('bookings')
      .select(`*, package:packages(name)`)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return { success: true, data: null };

    const endTime = new Date(data.end_time).getTime();
    if (Date.now() > endTime) {
      // Auto-expire booking if time passed (could be done via DB trigger or cron, but client-side check is ok for MVP)
      // Optionally update status to 'completed' here
      return { success: true, data: null };
    }

    const pkgType = data.package?.name?.includes('Full') ? 'full_match' : 'standard';

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
        totalAmount: data.total_amount,
        packageType: pkgType
      }
    };
  },

  endBooking: async (): Promise<ApiResponse<boolean>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, data: false };

    await supabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('user_id', user.id)
      .eq('status', 'active');

    return { success: true, data: true };
  },

  getBookingHistory: async (): Promise<ApiResponse<Booking[]>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, data: [] };

    const { data, error } = await supabase
      .from('bookings')
      .select(`*, court:courts(name), package:packages(name)`)
      .eq('user_id', user.id)
      .order('start_time', { ascending: false });

    if (error || !data) return { success: false, data: [] };

    const bookings: Booking[] = data.map((b: any) => ({
      id: b.id,
      userId: b.user_id,
      courtId: b.court_id,
      packageId: b.package_id,
      startTime: new Date(b.start_time).getTime(),
      endTime: new Date(b.end_time).getTime(),
      status: b.status,
      totalAmount: b.total_amount,
      courtName: b.court?.name || 'Sân không xác định',
      packageName: b.package?.name || 'Gói dịch vụ',
      packageType: b.package?.name?.includes('Full') ? 'full_match' : 'standard'
    }));

    return { success: true, data: bookings };
  },

  // 4. Highlights
  getHighlights: async (limit = 10): Promise<ApiResponse<Highlight[]>> => {
    try {
      const { data, error } = await supabase
        .from('highlights')
        .select(`
            *,
            court:courts(name),
            profile:profiles(name, avatar)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !data) {
        return { success: false, data: [] };
      }

      const highlights: Highlight[] = data.map((h: any) => ({
        id: h.id,
        userId: h.user_id,
        courtId: h.court_id,
        thumbnailUrl: h.thumbnail_url || 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=400&h=800&auto=format&fit=crop',
        videoUrl: h.video_url,
        durationSec: h.duration_sec,
        createdAt: h.created_at,
        likes: h.likes,
        views: h.views,
        courtName: h.court?.name || 'Sân',
        userAvatar: h.profile?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback',
        userName: h.profile?.name || 'Người chơi',
        isLiked: false,
        isPublic: h.is_public !== false // Default to true if not set
      }));

      return { success: true, data: highlights };
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  uploadVideo: async (file: Blob): Promise<ApiResponse<string>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, data: '', error: 'Not authenticated' };

    const fileExt = file.type.split('/')[1] || 'webm';
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload video error:', uploadError);
      return { success: false, data: '', error: uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);

    return { success: true, data: publicUrl };
  },

  createHighlight: async (courtId: string, videoUrl?: string, duration?: number, title?: string): Promise<ApiResponse<Highlight>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.from('highlights').insert({
      user_id: user.id,
      court_id: courtId,
      thumbnail_url: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=400&h=800&auto=format&fit=crop',
      video_url: videoUrl || 'https://customer-w42898.cloudflarestream.com/sample/manifest/video.m3u8',
      duration_sec: duration || 30,
      title: title || 'Highlight mới',
      likes: 0,
      views: 0,
      is_public: true
    }).select().single();

    if (error) throw error;

    return { success: true, data: data as any };
  },

  checkInBooking: async (bookingId: string): Promise<ApiResponse<boolean>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, data: false };

    // Verify booking belongs to user and is active
    const { data, error } = await supabase
      .from('bookings')
      .select('id')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return { success: false, data: false };
    }

    // In a real app, we might update a 'checked_in_at' timestamp here
    // For MVP, just verifying it exists and is active is enough
    return { success: true, data: true };
  },

  updateHighlightPrivacy: async (highlightId: string, isPublic: boolean): Promise<ApiResponse<boolean>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, data: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('highlights')
      .update({ is_public: isPublic })
      .eq('id', highlightId)
      .eq('user_id', user.id); // Only allow updating own highlights

    if (error) {
      console.error('Update highlight privacy error:', error);
      return { success: false, data: false, error: error.message };
    }

    return { success: true, data: true };
  }
};
