
export interface User {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  totalHighlights: number;
  hoursPlayed: number;
  courtsVisited: number;
  credits: number; // Số dư ví (VND)
  membershipTier: 'free' | 'pro' | 'elite';
  role?: 'player' | 'court_owner' | 'both'; // NEW: User role
  // Social fields
  bio?: string;
  isPublic?: boolean;
  followersCount?: number;
  followingCount?: number;
}

export interface Court {
  id: string;
  name: string;
  address: string;
  status: 'live' | 'busy' | 'available' | 'maintenance';
  thumbnailUrl: string;
  distanceKm: number;
  pricePerHour: number;
  rating: number;
  // Optional fields for CourtDetail page
  images?: string[];
  facilities?: string[];
  description?: string;
  openTime?: string;
  closeTime?: string;
  totalReviews?: number;
  features?: string[];
}

export interface Highlight {
  id: string;
  userId: string;
  courtId: string;
  thumbnailUrl: string;
  videoUrl: string;
  durationSec: number;
  createdAt: string; // ISO String
  likes: number;
  views: number;
  courtName?: string; // Joined data
  userAvatar?: string; // Joined data
  userName?: string; // Joined data
  isLiked?: boolean; // Client state
  isPublic?: boolean; // Privacy setting
  description?: string; // Video description
  title?: string; // Video title
  comments?: number; // Comment count
}

export interface Package {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  description: string;
  isBestValue?: boolean;
  features: string[];
  type?: 'per_booking' | 'monthly' | 'session_pack' | 'fixed_slot';
  session_count?: number;
  validity_days?: number;
}

export interface Booking {
  id: string;
  userId: string;
  courtId: string;
  packageId: string;
  startTime: number; // timestamp
  endTime: number; // timestamp
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  totalAmount: number;
  courtName?: string; // Expanded for UI
  packageName?: string; // Expanded for UI
  packageType?: 'standard' | 'full_match'; // New field
}

export interface MatchRequest {
  id: string;
  user_id: string;
  court_id?: string;
  preferred_time: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'pro';
  match_type: 'singles' | 'doubles' | 'any';
  gender: 'male' | 'female' | 'mixed' | 'any';
  status: 'open' | 'matched' | 'cancelled' | 'expired';
  description?: string;
  created_at: string;
  profiles?: any; // Joined profile (using any to avoid circular dependency or simple object)
}

export interface UserMembership {
  id: string;
  user_id: string;
  package_id: string;
  remaining_sessions: number;
  start_date: string;
  end_date?: string;
  status: 'active' | 'expired' | 'used_up';
  package?: Package; // Joined package
}


export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

export interface VideoSegment {
  id: string;
  recording_session_id: string;
  user_id: string;
  start_time: number;
  end_time: number;
  duration: number;
  status: 'pending' | 'uploaded' | 'processed' | 'failed';
  created_at: string;
  video_url?: string;
  thumbnail_url?: string;
  isSelected?: boolean; // Client-side only
}

export interface VideoProcessingJob {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  result_url?: string;
  error?: string;
  metadata?: any;
}
