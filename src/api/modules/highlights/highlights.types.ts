export interface Highlight {
    id: string;
    userId: string;
    courtId: string;
    thumbnailUrl: string;
    videoUrl: string;
    durationSec: number;
    createdAt: string;
    likes: number;
    views: number;
    courtName?: string;
    userAvatar?: string;
    userName?: string;
    isLiked?: boolean;
    isPublic?: boolean;
    description?: string;
    title?: string;
    comments?: number;
    highlightEvents?: any[];
}

export interface CreateHighlightData {
    courtId: string;
    videoUrl?: string;
    duration?: number;
    title?: string;
    description?: string;
    isPublic?: boolean;
}

export interface UpdateHighlightData {
    title?: string;
    description?: string;
    isPublic?: boolean;
}
