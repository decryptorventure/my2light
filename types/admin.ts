// Admin & Court Owner Type Definitions

export type UserRole = 'player' | 'court_owner' | 'both';

export interface CourtOwner {
    id: string;
    profileId: string;
    businessName: string;
    taxId?: string;
    phone: string;
    email: string;
    address?: string;
    bankAccount?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AdminStats {
    totalCourts: number;
    totalBookings: number;
    monthlyRevenue: number;
    occupancyRate: number;
}

export interface BookingManagement {
    id: string;
    userId: string;
    courtId: string;
    courtName: string;
    packageId: string;
    packageName: string;
    packageType?: 'standard' | 'full_match';
    playerName: string;
    playerPhone: string;
    playerAvatar?: string;
    startTime: number;
    endTime: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    totalAmount: number;
    createdAt: string;
    notes?: string;
}

export interface RevenueData {
    date: string;
    amount: number;
    bookings: number;
}

// Courts Management Types
export interface CourtFormData {
    name: string;
    address: string;
    description?: string;
    pricePerHour: number;
    openTime: string;
    closeTime: string;
    facilities: string[];
    images: string[];
    isActive: boolean;
    autoApproveBookings: boolean;
}

export interface CourtDetails {
    id: string;
    ownerId: string;
    name: string;
    address: string;
    description?: string;
    pricePerHour: number;
    openTime: string;
    closeTime: string;
    facilities: string[];
    images: string[];
    thumbnailUrl: string;
    status: 'live' | 'busy' | 'available' | 'maintenance';
    isActive: boolean;
    autoApproveBookings: boolean;
    rating: number;
    totalReviews: number;
    totalBookings: number;
    monthlyRevenue: number;
    createdAt: string;
    updatedAt: string;
}
