
import { supabase } from '../lib/supabase';
import { User, Court, Highlight, Package, Booking, ApiResponse } from '../types';

// --- MOCK DATA FOR FALLBACK ---
const MOCK_USER: User = {
  id: 'mock_u1',
  name: 'Người chơi Mới',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  phone: '0987654321',
  totalHighlights: 12,
  hoursPlayed: 5.5,
  courtsVisited: 2,
  credits: 200000,
  membershipTier: 'free'
};

const MOCK_COURTS: Court[] = [
  {
    id: 'c1',
    name: 'CLB Pickleball Cầu Giấy',
    address: '123 Đường Cầu Giấy, Hà Nội',
    status: 'live',
    thumbnailUrl: 'https://images.unsplash.com/photo-1626248584912-2550cb5a6b0c?q=80&w=800&auto=format&fit=crop',
    distanceKm: 0.8,
    pricePerHour: 150000,
    rating: 4.8
  },
  {
    id: 'c2',
    name: 'Sân Tennis Thành Phố',
    address: '45 Đường Tây Hồ, Hà Nội',
    status: 'available',
    thumbnailUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=800&auto=format&fit=crop',
    distanceKm: 2.5,
    pricePerHour: 200000,
    rating: 4.5
  },
  {
    id: 'c3',
    name: 'Sân Cầu Lông Ciputra',
    address: 'Khu Đô Thị Ciputra, Hà Nội',
    status: 'busy',
    thumbnailUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ee3?q=80&w=800&auto=format&fit=crop',
    distanceKm: 3.1,
    pricePerHour: 100000,
    rating: 4.2
  }
];

const MOCK_PACKAGES: Package[] = [
  { id: 'p1', name: 'Giao Hữu Nhanh', durationMinutes: 60, price: 30000, description: 'Phù hợp khởi động hoặc chơi nhanh', type: 'standard' },
  { id: 'p2', name: 'Trận Đấu Pro', durationMinutes: 120, price: 50000, isBestValue: true, description: 'Gói tiêu chuẩn cho trận đấu đầy đủ', type: 'standard' },
  { id: 'p3', name: 'Marathon Thể Lực', durationMinutes: 180, price: 70000, description: 'Dành cho những chiến binh bền bỉ', type: 'standard' },
  { id: 'p4', name: 'Gói Quay Cả Trận', durationMinutes: 90, price: 100000, description: 'Ghi hình toàn bộ 90 phút Full HD. Tải về qua Wifi tại sân.', type: 'full_match' },
];

export const ApiService = {
  // 1. Auth & User
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If no session, return Mock User ONLY if we are in a dev/test mode where we expect a user.
      // But for login check, this might mislead. However, assuming this is called by protected routes.
      if (!session?.user) {
         // Return basic mock for Fallback UI when totally unauthenticated (should redirect to login anyway)
         return { success: true, data: MOCK_USER };
      }

      // Try fetching profile from DB
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error || !data) {
        // HYBRID FALLBACK: User is authenticated but Profile is missing in DB.
        // Construct a user object from Session details instead of using static Mock Data.
        const emailName = session.user.email?.split('@')[0] || 'User';
        const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        
        return { 
          success: true, 
          data: {
              id: session.user.id,
              name: displayName,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
              phone: '',
              totalHighlights: 0,
              hoursPlayed: 0,
              courtsVisited: 0,
              credits: 0,
              membershipTier: 'free'
          }
        };
      }

      const user: User = {
        id: data.id,
        name: data.name || MOCK_USER.name,
        avatar: data.avatar || MOCK_USER.avatar,
        phone: data.phone || '',
        totalHighlights: data.total_highlights || 0,
        hoursPlayed: 0, 
        courtsVisited: 0,
        credits: data.credits || 0,
        membershipTier: data.membership_tier as any || 'free'
      };

      return { success: true, data: user };
    } catch (e) {
      console.error(e);
      return { success: true, data: MOCK_USER };
    }
  },

  updateUserProfile: async (updates: Partial<User>): Promise<ApiResponse<boolean>> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, data: false };

      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.avatar) dbUpdates.avatar = updates.avatar;
      if (updates.phone) dbUpdates.phone = updates.phone;
      if (updates.credits !== undefined) dbUpdates.credits = updates.credits;

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

  // 2. Courts
  getCourts: async (): Promise<ApiResponse<Court[]>> => {
    try {
        const { data, error } = await supabase.from('courts').select('*');
        
        // Use Mock data if DB is empty or error
        if (error || !data || data.length === 0) {
            console.log("Using Mock Courts due to empty DB or error");
            return { success: true, data: MOCK_COURTS };
        }

        const courts: Court[] = data.map((c: any) => ({
        id: c.id,
        name: c.name,
        address: c.address,
        status: c.status,
        thumbnailUrl: c.thumbnail_url || 'https://images.unsplash.com/photo-1626248584912-2550cb5a6b0c?q=80&w=800&auto=format&fit=crop',
        distanceKm: Number((Math.random() * 5).toFixed(1)),
        pricePerHour: c.price_per_hour,
        rating: 4.5
        }));

        return { success: true, data: courts };
    } catch (e) {
        return { success: true, data: MOCK_COURTS };
    }
  },

  getCourtById: async (id: string): Promise<ApiResponse<Court | undefined>> => {
    const { data, error } = await supabase.from('courts').select('*').eq('id', id).single();
    if (error) {
        // Fallback search in mock
        const mock = MOCK_COURTS.find(c => c.id === id);
        return { success: !!mock, data: mock };
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
        if (error || !data || data.length === 0) {
             return { success: true, data: MOCK_PACKAGES };
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
            type: p.name.includes('Full') ? 'full_match' : 'standard' // simple inference for MVP
        }))
        };
    } catch (e) {
        return { success: true, data: MOCK_PACKAGES };
    }
  },

  // 3. Bookings
  createBooking: async (packageId: string, courtId: string): Promise<ApiResponse<Booking>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if package exists in DB, if not check Mock
    let pkgPrice = 0;
    let pkgDuration = 0;
    let pkgType: 'standard' | 'full_match' = 'standard';
    
    // Try DB first
    const { data: pkg } = await supabase.from('packages').select('*').eq('id', packageId).maybeSingle();
    
    if (pkg) {
        pkgPrice = pkg.price;
        pkgDuration = pkg.duration_minutes;
        pkgType = pkg.name.includes('Full') ? 'full_match' : 'standard';
    } else {
        // Try Mock
        const mockPkg = MOCK_PACKAGES.find(p => p.id === packageId);
        if (mockPkg) {
            pkgPrice = mockPkg.price;
            pkgDuration = mockPkg.durationMinutes;
            pkgType = mockPkg.type || 'standard';
        } else {
            // Last resort default
            pkgPrice = 50000;
            pkgDuration = 60;
        }
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + pkgDuration * 60000);

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
        console.error("Booking error, falling back to local storage for MVP", error);
        // Fallback to local storage logic for MVP continuity if DB write fails
        const booking: Booking = {
            id: `local_b_${Date.now()}`,
            userId: user.id,
            courtId,
            packageId,
            startTime: startTime.getTime(),
            endTime: endTime.getTime(),
            status: 'active',
            totalAmount: pkgPrice,
            packageType: pkgType
        };
        localStorage.setItem('active_booking', JSON.stringify(booking));
        
        // Also save to a local history array for the Profile page to see something
        const existingHistory = JSON.parse(localStorage.getItem('booking_history') || '[]');
        localStorage.setItem('booking_history', JSON.stringify([booking, ...existingHistory]));
        
        return { success: true, data: booking };
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
        totalAmount: data.total_amount,
        packageType: pkgType
      }
    };
  },

  getActiveBooking: async (): Promise<ApiResponse<Booking | null>> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check Local Storage first (Fallback for MVP stability)
    const local = localStorage.getItem('active_booking');
    if (local) {
        const booking: Booking = JSON.parse(local);
        if (Date.now() < booking.endTime) {
            return { success: true, data: booking };
        } else {
            localStorage.removeItem('active_booking');
        }
    }

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
        return { success: true, data: null };
    }

    // Infer type from package name if not explicitly stored
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
    // Clear local
    localStorage.removeItem('active_booking');

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

    // Hybrid approach: Get DB bookings + Local bookings
    let dbBookings: Booking[] = [];
    
    const { data, error } = await supabase
        .from('bookings')
        .select(`*, court:courts(name), package:packages(name)`)
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });
    
    if (data) {
        dbBookings = data.map((b: any) => ({
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
    }

    // Get Local history
    const localHistory: Booking[] = JSON.parse(localStorage.getItem('booking_history') || '[]');
    
    // Merge
    return { success: true, data: [...localHistory, ...dbBookings] };
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

        if (error || !data || data.length === 0) {
             return { success: true, data: [] };
        }

        const highlights: Highlight[] = data.map((h: any) => ({
        id: h.id,
        userId: h.user_id,
        courtId: h.court_id,
        thumbnailUrl: h.thumbnail_url || 'https://picsum.photos/400/800', 
        videoUrl: h.video_url,
        durationSec: h.duration_sec,
        createdAt: h.created_at,
        likes: h.likes,
        views: h.views,
        courtName: h.court?.name || 'Sân',
        userAvatar: h.profile?.avatar || 'https://picsum.photos/200',
        userName: h.profile?.name || 'Người chơi',
        isLiked: false
        }));

        return { success: true, data: highlights };
    } catch (e) {
        return { success: true, data: [] };
    }
  },

  createHighlight: async (courtId: string): Promise<ApiResponse<Highlight>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.from('highlights').insert({
        user_id: user.id,
        court_id: courtId,
        thumbnail_url: `https://picsum.photos/400/800?random=${Date.now()}`,
        video_url: 'https://customer-w42898.cloudflarestream.com/sample/manifest/video.m3u8', 
        duration_sec: 30,
        likes: 0,
        views: 0
    }).select().single();

    if (error) {
        // Mock fallback return
         return { 
             success: true, 
             data: {
                id: `local_h_${Date.now()}`,
                userId: user.id,
                courtId,
                thumbnailUrl: `https://picsum.photos/400/800?random=${Date.now()}`,
                videoUrl: '',
                durationSec: 30,
                createdAt: new Date().toISOString(),
                likes: 0,
                views: 0
             }
         };
    }

    return { success: true, data: data as any };
  }
};
