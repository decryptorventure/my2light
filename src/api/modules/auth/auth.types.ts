export interface LoginCredentials {
    phone: string;
    password: string;
}

export interface RegisterData {
    name: string;
    phone: string;
    password: string;
}

export interface UserSession {
    user: {
        id: string;
        phone: string;
        email?: string;
    };
    access_token: string;
    refresh_token: string;
    expires_at: number;
}

export interface AuthResponse {
    session: UserSession;
    user: any; // Will use User type from main types
}

export interface UpdateProfileData {
    name?: string;
    bio?: string;
    avatar?: string;
    is_public?: boolean;
}
