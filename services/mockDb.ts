import { User, Court, Highlight, Package, Booking, ApiResponse } from '../types';

// --- DATA GIẢ LẬP (MOCK DATA) ---
const DELAY_MS = 800; // Giả lập độ trễ mạng

const INITIAL_USER: User = {
  id: 'u1',
  name: 'Alex Nguyễn',
  avatar: 'https://picsum.photos/id/64/200/200',
  phone: '0987654321',
  totalHighlights: 42,
  hoursPlayed: 12.5,
  courtsVisited: 5,
  credits: 500000,
  membershipTier: 'pro'
};

const COURTS: Court[] = [
  {
    id: 'c1',
    name: 'CLB Pickleball Cầu Giấy',
    address: '123 Đường Cầu Giấy, Hà Nội',
    status: 'live',
    thumbnailUrl: 'https://picsum.photos/id/1057/600/400',
    distanceKm: 0.8,
    pricePerHour: 150000,
    rating: 4.8
  },
  {
    id: 'c2',
    name: 'Sân Tennis Thành Phố',
    address: '45 Đường Tây Hồ, Hà Nội',
    status: 'available',
    thumbnailUrl: 'https://picsum.photos/id/1056/600/400',
    distanceKm: 2.5,
    pricePerHour: 200000,
    rating: 4.5
  },
  {
    id: 'c3',
    name: 'Sân Cầu Lông Sunshine',
    address: 'Khu Đô Thị Ciputra, Hà Nội',
    status: 'busy',
    thumbnailUrl: 'https://picsum.photos/id/1040/600/400',
    distanceKm: 3.1,
    pricePerHour: 100000,
    rating: 4.2
  }
];

const PACKAGES: Package[] = [
  { id: 'p1', name: 'Giao Hữu Nhanh', durationMinutes: 60, price: 30000, description: 'Phù hợp khởi động hoặc chơi nhanh' },
  { id: 'p2', name: 'Trận Đấu Pro', durationMinutes: 120, price: 50000, isBestValue: true, description: 'Gói tiêu chuẩn cho trận đấu đầy đủ' },
  { id: 'p3', name: 'Marathon Thể Lực', durationMinutes: 180, price: 70000, description: 'Dành cho những chiến binh bền bỉ' },
];

const INITIAL_HIGHLIGHTS: Highlight[] = [
  {
    id: 'h1',
    userId: 'u1',
    courtId: 'c1',
    thumbnailUrl: 'https://picsum.photos/id/237/400/800',
    videoUrl: '',
    durationSec: 15,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    likes: 128,
    views: 4500,
    courtName: 'CLB Pickleball Cầu Giấy',
    userAvatar: INITIAL_USER.avatar,
    userName: INITIAL_USER.name,
    isLiked: true
  },
  {
    id: 'h2',
    userId: 'u1',
    courtId: 'c2',
    thumbnailUrl: 'https://picsum.photos/id/1/400/800',
    videoUrl: '',
    durationSec: 22,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    likes: 85,
    views: 2100,
    courtName: 'Sân Tennis Thành Phố',
    userAvatar: INITIAL_USER.avatar,
    userName: INITIAL_USER.name,
    isLiked: false
  },
  {
    id: 'h3',
    userId: 'u1',
    courtId: 'c1',
    thumbnailUrl: 'https://picsum.photos/id/100/400/800',
    videoUrl: '',
    durationSec: 10,
    createdAt: new Date(Date.now() - 300000).toISOString(),
    likes: 12,
    views: 150,
    courtName: 'CLB Pickleball Cầu Giấy',
    userAvatar: INITIAL_USER.avatar,
    userName: INITIAL_USER.name,
    isLiked: false
  }
];

// Helper để delay (giả lập network)
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- API SERVICE LAYER ---
export const ApiService = {
  // 1. User APIs
  getUserProfile: async (): Promise<ApiResponse<User>> => {
    await wait(DELAY_MS);
    const stored = localStorage.getItem('my2light_user');
    const data = stored ? JSON.parse(stored) : INITIAL_USER;
    return { success: true, data };
  },

  updateUser: async (user: User): Promise<ApiResponse<User>> => {
    await wait(DELAY_MS / 2);
    localStorage.setItem('my2light_user', JSON.stringify(user));
    return { success: true, data: user };
  },

  // 2. Court APIs
  getCourts: async (): Promise<ApiResponse<Court[]>> => {
    await wait(DELAY_MS);
    // Trong thực tế, sẽ gọi API lấy danh sách sân dựa trên GPS
    return { success: true, data: COURTS };
  },
  
  getCourtById: async (id: string): Promise<ApiResponse<Court | undefined>> => {
    await wait(DELAY_MS / 2);
    const court = COURTS.find(c => c.id === id);
    return { success: !!court, data: court };
  },

  getPackages: async (): Promise<ApiResponse<Package[]>> => {
    await wait(DELAY_MS / 2);
    return { success: true, data: PACKAGES };
  },

  // 3. Highlight APIs
  getHighlights: async (limit = 10): Promise<ApiResponse<Highlight[]>> => {
    await wait(DELAY_MS); // Feed load lâu hơn chút
    const stored = localStorage.getItem('my2light_highlights');
    let data = stored ? JSON.parse(stored) : INITIAL_HIGHLIGHTS;
    
    // Sắp xếp mới nhất trước
    data = data.sort((a: Highlight, b: Highlight) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return { success: true, data: data.slice(0, limit) };
  },

  createHighlight: async (courtId: string): Promise<ApiResponse<Highlight>> => {
    // Không cần delay nhiều vì cần phản hồi nhanh cho người dùng
    await wait(200); 
    
    const userRes = await ApiService.getUserProfile();
    const courtRes = await ApiService.getCourtById(courtId);
    
    const newHighlight: Highlight = {
      id: `h_new_${Date.now()}`,
      userId: userRes.data.id,
      courtId: courtId,
      thumbnailUrl: `https://picsum.photos/400/800?random=${Date.now()}`,
      videoUrl: '',
      durationSec: 15,
      createdAt: new Date().toISOString(),
      likes: 0,
      views: 0,
      courtName: courtRes.data?.name || 'Sân không xác định',
      userAvatar: userRes.data.avatar,
      userName: userRes.data.name,
      isLiked: false
    };

    // Save to local storage
    const stored = localStorage.getItem('my2light_highlights');
    const current = stored ? JSON.parse(stored) : INITIAL_HIGHLIGHTS;
    localStorage.setItem('my2light_highlights', JSON.stringify([newHighlight, ...current]));

    // Update User stats
    const updatedUser = { ...userRes.data, totalHighlights: userRes.data.totalHighlights + 1 };
    await ApiService.updateUser(updatedUser);

    return { success: true, data: newHighlight };
  },

  // 4. Booking APIs
  getActiveBooking: async (): Promise<ApiResponse<Booking | null>> => {
    await wait(DELAY_MS / 2);
    const stored = localStorage.getItem('my2light_active_booking');
    if (!stored) return { success: true, data: null };
    
    const booking: Booking = JSON.parse(stored);
    
    // Check expiry
    if (Date.now() > booking.endTime) {
      localStorage.removeItem('my2light_active_booking');
      return { success: true, data: null };
    }
    
    return { success: true, data: booking };
  },

  createBooking: async (packageId: string, courtId: string): Promise<ApiResponse<Booking>> => {
    await wait(1500); // Giả lập thanh toán tốn thời gian
    
    const pkg = PACKAGES.find(p => p.id === packageId);
    if (!pkg) throw new Error("Gói không hợp lệ");

    const startTime = Date.now();
    const endTime = startTime + (pkg.durationMinutes * 60 * 1000); 
    
    const booking: Booking = {
      id: `b_${Date.now()}`,
      userId: 'u1',
      courtId,
      packageId,
      startTime,
      endTime,
      status: 'active',
      totalAmount: pkg.price
    };

    localStorage.setItem('my2light_active_booking', JSON.stringify(booking));
    
    // Trừ tiền user
    const userRes = await ApiService.getUserProfile();
    const updatedUser = { ...userRes.data, credits: userRes.data.credits - pkg.price };
    await ApiService.updateUser(updatedUser);

    return { success: true, data: booking };
  },

  endBooking: async (): Promise<ApiResponse<boolean>> => {
    await wait(500);
    localStorage.removeItem('my2light_active_booking');
    return { success: true, data: true };
  }
};
