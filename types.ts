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
}

export interface Package {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  description: string;
  isBestValue?: boolean;
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
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}