export interface Comment {
    id: string;
    userId: string;
    highlightId: string;
    text: string;
    createdAt: string;
    userName?: string;
    userAvatar?: string;
}

export interface CreateCommentData {
    highlightId: string;
    text: string;
}

export interface Follow {
    id: string;
    followerId: string;
    followingId: string;
    createdAt: string;
}
