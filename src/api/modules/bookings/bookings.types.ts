export interface Booking {
    id: string;
    userId: string;
    courtId: string;
    packageId: string;
    startTime: number;
    endTime: number;
    status: 'pending' | 'active' | 'completed' | 'cancelled';
    totalAmount: number;
    courtName?: string;
    packageName?: string;
    packageType?: 'standard' | 'full_match';
}

export interface CreateBookingData {
    courtId: string;
    startTime: number;
    durationHours: number;
    packageId?: string;
}

export interface UpdateBookingData {
    status?: 'pending' | 'active' | 'completed' | 'cancelled';
    startTime?: number;
    endTime?: number;
}
