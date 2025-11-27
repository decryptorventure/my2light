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
    courtName: string;
    playerName: string;
    playerPhone: string;
    startTime: number;
    endTime: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    totalAmount: number;
    packageName: string;
    createdAt: string;
}

export interface RevenueData {
    date: string;
    amount: number;
    bookings: number;
}
