export interface Court {
    id: string;
    name: string;
    address: string;
    status: 'live' | 'busy' | 'available' | 'maintenance';
    thumbnailUrl: string;
    distanceKm: number;
    pricePerHour: number;
    rating: number;
    images?: string[];
    facilities?: string[];
    description?: string;
    openTime?: string;
    closeTime?: string;
    totalReviews?: number;
    features?: string[];
}

export interface CourtDetails extends Court {
    owner_id: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

export interface CreateCourtData {
    name: string;
    address: string;
    description?: string;
    pricePerHour: number;
    openTime: string;
    closeTime: string;
    imageUrl?: string;
    facilities?: string[];
    features?: string[];
}

export interface UpdateCourtData {
    name?: string;
    address?: string;
    description?: string;
    pricePerHour?: number;
    openTime?: string;
    closeTime?: string;
    is_active?: boolean;
    status?: 'live' | 'busy' | 'available' | 'maintenance';
}
