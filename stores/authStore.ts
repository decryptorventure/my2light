import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { User } from '../types';
import { authService } from '../src/api'; // NEW API
import { supabase } from '../lib/supabase';

interface AuthState {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    initialized: boolean;

    // Actions
    initialize: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    session: null,
    isLoading: true,
    initialized: false,

    initialize: async () => {
        try {
            set({ isLoading: true });

            // Get initial session - Supabase automatically persists sessions in localStorage by default
            // This enables auto-login when user returns to the app
            const { data: { session } } = await supabase.auth.getSession();
            set({ session });

            if (session) {
                // Fetch user profile if session exists
                const response = await authService.getCurrentUser();
                if (response.success) {
                    set({ user: response.data });
                }
            }

            // Listen for auth changes
            supabase.auth.onAuthStateChange(async (_event, session) => {
                set({ session });

                if (session) {
                    // If user changed or just signed in, fetch profile
                    const currentUser = get().user;
                    if (!currentUser || currentUser.id !== session.user.id) {
                        const response = await authService.getCurrentUser();
                        if (response.success) {
                            set({ user: response.data });
                        }
                    }
                } else {
                    set({ user: null });
                }
            });

        } catch (error) {
            console.error('Auth initialization error:', error);
        } finally {
            set({ isLoading: false, initialized: true });
        }
    },

    refreshProfile: async () => {
        const { session } = get();
        if (!session) return;

        const response = await authService.getCurrentUser();
        if (response.success) {
            set({ user: response.data });
        }
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null });
    }
}));
