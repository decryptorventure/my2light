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

      // Calculate fallback display name from email
      const emailName = session.user.email?.split('@')[0] || 'User';
      const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);

      if (error || !data) {
        // Profile doesn't exist - create it
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

      // Calculate stats from bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('court_id, start_time, end_time, status')
        .eq('user_id', session.user.id)
        .eq('status', 'completed');

      let hoursPlayed = 0;
      const visitedCourts = new Set();

      if (bookings) {
        bookings.forEach((b: any) => {
          const duration = (new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / 3600000;
          hoursPlayed += duration;
          visitedCourts.add(b.court_id);
        });
      }

      // Calculate total highlights
      const { count: highlightsCount } = await supabase
        .from('highlights')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);

      const user: User = {
        id: data.id,
        name: data.name || displayName,
        avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}`,
        phone: data.phone || '',
        totalHighlights: highlightsCount || 0,
        hoursPlayed: Number(hoursPlayed.toFixed(1)),
        courtsVisited: visitedCourts.size,
        credits: data.credits || 0,
        membershipTier: (data.membership_tier as any) || 'free',
        role: (data.role as any) || 'player', // NEW: Include role
        bio: data.bio,
        isPublic: data.is_public,
        followersCount: data.followers_count || 0,
        followingCount: data.following_count || 0
      };

      return { success: true, data: user };
    } catch (e) {
      console.error('getCurrentUser error:', e);
      return { success: false, data: null as any, error: 'Failed to fetch user' };
    }
  },

  toggleLike: async (highlightId: string, currentLikes: number, isLiked: boolean): Promise<ApiResponse<boolean>> => {
    // For MVP without a likes table, we just update the count on the highlight
    // In a real app, we would insert/delete from a 'highlight_likes' table
    const newCount = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

    const { error } = await supabase
      .from('highlights')
      .update({ likes: newCount })
      .eq('id', highlightId);

    if (error) return { success: false, data: false };
    return { success: true, data: true };
  },

  updateUserProfile: async (updates: Partial<{
    name: string;
    phone: string;
    avatar: string;
    credits: number;
    has_onboarded: boolean;
    bio: string;
    is_public: boolean;
  }>): Promise<ApiResponse<boolean>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, data: false };

    try {
      // 1. Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
      if (updates.credits !== undefined) dbUpdates.credits = updates.credits;
      if (updates.has_onboarded !== undefined) dbUpdates.has_onboarded = updates.has_onboarded;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.is_public !== undefined) dbUpdates.is_public = updates.is_public;

      if (!existingProfile) {
        // 2. Create new profile with defaults + updates
        const emailName = user.email?.split('@')[0] || 'User';
        const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);

        const newProfile = {
          id: user.id,
          name: displayName, // Default
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`, // Default
          phone: '',
          credits: 200000, // Default welcome bonus
          membership_tier: 'free',
          total_highlights: 0,
          has_onboarded: false,
          ...dbUpdates // Override with updates
          // updated_at removed as it does not exist in DB
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert(newProfile);

        if (insertError) {
          console.error('Failed to create profile in update:', insertError);
          return { success: false, data: false, error: insertError.message };
        }
      } else {
        // 3. Update existing profile
        console.log('🔄 Updating existing profile with:', dbUpdates);
        const { error: updateError } = await supabase
          .from('profiles')
          .update(dbUpdates)
          .eq('id', user.id);

        if (updateError) {
          console.error("Update profile error", updateError);
          return { success: false, data: false, error: updateError.message };
        }
        console.log('✅ Profile updated successfully');
      }

      return { success: true, data: true };
    } catch (e) {
      console.error("Exception in updateUserProfile", e);
      return { success: false, data: false, error: 'Internal error' };
    }
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
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .eq('is_active', true); // Only show active courts

      if (error || !data) {
        console.error("Error fetching courts:", error);
        return { success: false, data: [] };
      }

      const courts: Court[] = data.map((c: any) => ({
        id: c.id,
        name: c.name,
        address: c.address,
        status: c.status,
        thumbnailUrl: c.thumbnail_url || c.images?.[0] || 'https://images.unsplash.com/photo-1622163642998-1ea36b1dde3b?q=80&w=800&auto=format&fit=crop',
        distanceKm: c.distance_km || 0,
        pricePerHour: c.price_per_hour,
        rating: c.rating || 0,
        // Optional fields for detail page
        images: c.images || [],
        facilities: c.facilities || [],
        description: c.description,
        openTime: c.open_time,
        closeTime: c.close_time,
        totalReviews: c.total_reviews || 0
      }));

      return { success: true, data: courts };
    } catch (e) {
      console.error('getCourts error:', e);
      return { success: false, data: [] };
    }
  },

  getCourtById: async (id: string): Promise<ApiResponse<Court | undefined>> => {
    const { data, error } = await supabase
      .from('courts')
      .select('*')
      .eq('id', id)
      .single();

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
        thumbnailUrl: data.thumbnail_url || data.images?.[0] || 'https://images.unsplash.com/photo-1622163642998-1ea36b1dde3b?q=80&w=800&auto=format&fit=crop',
        distanceKm: data.distance_km || 0,
        pricePerHour: data.price_per_hour,
        rating: data.rating || 0,
        // Detailed fields
        images: data.images || [],
        facilities: data.facilities || [],
        description: data.description,
        openTime: data.open_time,
        closeTime: data.close_time,
        totalReviews: data.total_reviews || 0
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
          features: p.features || [],
          type: 'per_booking'
        }))
      };
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  // 3. Bookings
  createBooking: async (courtId: string, startTimeTimestamp: number, durationHours: number = 1, packageId?: string): Promise<ApiResponse<Booking>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get Court details for base price
    const { data: court, error: courtError } = await supabase.from('courts').select('price_per_hour').eq('id', courtId).single();
    if (courtError || !court) throw new Error('Court not found');

    let totalAmount = court.price_per_hour * durationHours;
    let pkgType = 'standard';

    // Get Package details if selected
    if (packageId) {
      const { data: pkg, error: pkgError } = await supabase.from('packages').select('*').eq('id', packageId).single();
      if (pkgError || !pkg) throw new Error('Package not found');

      totalAmount += pkg.price;
      pkgType = pkg.name.includes('Full') ? 'full_match' : 'standard';
    }

    const startTime = new Date(startTimeTimestamp);
    const endTime = new Date(startTime.getTime() + durationHours * 60 * 60000);

    // Check for overlapping bookings (both active and confirmed)
    const { data: conflicts, error: conflictError } = await supabase
      .from('bookings')
      .select('id')
      .eq('court_id', courtId)
      .in('status', ['confirmed', 'active'])
      .or(`and(start_time.lte.${endTime.toISOString()},end_time.gte.${startTime.toISOString()})`);

    if (conflictError) {
      console.error("Error checking conflicts:", conflictError);
      // If it's a schema cache error, provide helpful message
      if (conflictError.message?.includes('schema cache')) {
        throw new Error('Database schema needs refresh. Please contact support or try again in a few moments.');
      }
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

    if (!profile || profile.credits < totalAmount) {
      throw new Error(`Không đủ tiền! Bạn cần ${totalAmount.toLocaleString()}đ nhưng chỉ có ${(profile?.credits || 0).toLocaleString()}đ`);
    }

    const { data, error } = await supabase.from('bookings').insert({
      user_id: user.id,
      court_id: courtId,
      package_id: packageId || null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      total_amount: totalAmount,
      status: 'active'
    }).select().single();

    if (error) {
      console.error("Booking error", error);
      throw error;
    }

    // Deduct credits from user profile
    await supabase
      .from('profiles')
      .update({ credits: profile.credits - totalAmount })
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
        packageType: pkgType as any
      }
    };
  },

  getActiveBooking: async (): Promise<ApiResponse<Booking | null>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, data: null };

    const now = new Date().toISOString();
    const bufferTime = new Date(Date.now() + 15 * 60000).toISOString(); // Allow entering 15 mins early

    const { data, error } = await supabase
      .from('bookings')
      .select(`*, package:packages(name)`)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .lte('start_time', bufferTime) // Started or starting soon
      .gte('end_time', now)   // Not ended
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return { success: true, data: null };

    const pkgType = data.package?.name?.includes('Full') ? 'full_match' : 'standard';

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
        totalAmount: data.total_amount,
        packageType: pkgType
      }
    };
  },

  getUpcomingBooking: async (courtId?: string): Promise<ApiResponse<Booking | null>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, data: null };

    const now = new Date().toISOString();
    // Look for bookings starting in the next 30 minutes
    const thirtyMinsLater = new Date(Date.now() + 30 * 60000).toISOString();

    let query = supabase
      .from('bookings')
      .select(`*, package:packages(name)`)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('start_time', now)
      .lte('start_time', thirtyMinsLater);

    if (courtId) {
      query = query.eq('court_id', courtId);
    }

    const { data, error } = await query.order('start_time', { ascending: true }).limit(1).maybeSingle();

    if (!data) return { success: true, data: null };

    const pkgType = data.package?.name?.includes('Full') ? 'full_match' : 'standard';

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

  cancelBooking: async (bookingId: string, reason?: string): Promise<ApiResponse<boolean>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, data: false, error: 'User not authenticated' };

      // Get booking details for refund
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*, packages(price)')
        .eq('id', bookingId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !booking) {
        return { success: false, data: false, error: 'Booking not found' };
      }

      // Update booking status to cancelled
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (updateError) {
        return { success: false, data: false, error: updateError.message };
      }

      // Refund credits to user wallet
      const refundAmount = booking.packages?.price || booking.total_amount || 0;
      const { data: userData } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (userData) {
        await supabase
          .from('profiles')
          .update({ credits: (userData.credits || 0) + refundAmount })
          .eq('id', user.id);
      }

      return { success: true, data: true };
    } catch (error) {
      console.error('Cancel booking error:', error);
      return { success: false, data: false, error: 'Failed to cancel booking' };
    }
  },

  rescheduleBooking: async (
    bookingId: string,
    newStartTime: number
  ): Promise<ApiResponse<Booking>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, data: {} as Booking, error: 'User not authenticated' };

      // Get booking to calculate new end time
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*, packages(duration_minutes)')
        .eq('id', bookingId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !booking) {
        return { success: false, data: {} as Booking, error: 'Booking not found' };
      }

      const durationMs = (booking.packages?.duration_minutes || 60) * 60 * 1000;
      const newEndTime = newStartTime + durationMs;

      // Update booking times
      const { data, error } = await supabase
        .from('bookings')
        .update({
          start_time: new Date(newStartTime).toISOString(),
          end_time: new Date(newEndTime).toISOString(),
          rescheduled_from: booking.start_time
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) {
        return { success: false, data: {} as Booking, error: error.message };
      }

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
    } catch (error) {
      console.error('Reschedule booking error:', error);
      return { success: false, data: {} as Booking, error: 'Failed to reschedule booking' };
    }
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
        .select('*, court:courts(name), profile:profiles(name, avatar)')
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
        userAvatar: h.profile?.name || 'Người chơi',
        userName: h.profile?.name || 'Người chơi',
        isLiked: false,
        isPublic: h.is_public !== false,
        comments: 0
      }));

      return { success: true, data: highlights };
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  getUserHighlights: async (userId: string, limit = 50): Promise<ApiResponse<Highlight[]>> => {
    try {
      const { data, error } = await supabase
        .from('highlights')
        .select('*, court:courts(name), profile:profiles(name, avatar)')
        .eq('user_id', userId)
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
        userAvatar: h.profile?.name || 'Người chơi',
        userName: h.profile?.name || 'Người chơi',
        isLiked: false,
        isPublic: h.is_public !== false,
        comments: 0
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

  createHighlight: async (courtId: string, videoUrl?: string, duration?: number, title?: string, description?: string): Promise<ApiResponse<Highlight>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.from('highlights').insert({
      user_id: user.id,
      court_id: courtId,
      thumbnail_url: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=400&h=800&auto=format&fit=crop',
      video_url: videoUrl || 'https://customer-w42898.cloudflarestream.com/sample/manifest/video.m3u8',
      duration_sec: duration || 30,
      title: title || 'Highlight mới',
      description: description || '',
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
  },

  // Process top-up transaction
  processTopUp: async (
    transactionId: string,
    amount: number,
    method: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'User not authenticated' };

      // Get current credits
      const { data: userData } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (!userData) {
        return { success: false, error: 'User not found' };
      }

      // Update user credits
      const newBalance = (userData.credits || 0) + amount;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: newBalance })
        .eq('id', user.id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Create transaction record in transactions table
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'credit_purchase',
          amount: amount,
          status: 'completed',
          payment_method: method,
          reference_id: transactionId,
          metadata: {
            timestamp: new Date().toISOString(),
            previous_balance: userData.credits,
            new_balance: newBalance
          }
        });

      if (transactionError) {
        console.error('Failed to create transaction record:', transactionError);
        // Note: We don't fail the top-up if transaction recording fails
        // The credits have already been added successfully
      }

      return { success: true };

    } catch (error) {
      console.error('Process top-up error:', error);
      return { success: false, error: 'Failed to process top-up' };
    }
  },

  // Get transaction history
  getTransactionHistory: async (limit: number = 50): Promise<ApiResponse<any[]>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, data: [], error: 'Not authenticated' };

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Get transaction history error:', error);
        return { success: false, data: [], error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Get transaction history exception:', error);
      return { success: false, data: [], error: error.message || 'Failed to fetch transaction history' };
    }
  },

  // Get transaction summary
  getTransactionSummary: async (): Promise<ApiResponse<any>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, data: null, error: 'Not authenticated' };

      const { data, error } = await supabase
        .rpc('get_transaction_summary', { p_user_id: user.id });

      if (error) {
        console.error('Get transaction summary error:', error);
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data: data && data.length > 0 ? data[0] : null };
    } catch (error: any) {
      console.error('Get transaction summary exception:', error);
      return { success: false, data: null, error: error.message || 'Failed to fetch transaction summary' };
    }
  }
};
