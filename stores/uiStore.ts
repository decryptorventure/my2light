import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface UiState {
    isLoading: boolean;
    toasts: Toast[];
    modals: Record<string, boolean>;

    // Actions
    setLoading: (isLoading: boolean) => void;
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    hideToast: (id: string) => void;
    openModal: (modalId: string) => void;
    closeModal: (modalId: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
    isLoading: false,
    toasts: [],
    modals: {},

    setLoading: (isLoading) => set({ isLoading }),

    showToast: (message, type = 'info', duration = 3000) => {
        const id = Math.random().toString(36).substring(7);
        const toast = { id, message, type, duration };

        set((state) => ({ toasts: [...state.toasts, toast] }));

        if (duration > 0) {
            setTimeout(() => {
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id)
                }));
            }, duration);
        }
    },

    hideToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
    })),

    openModal: (modalId) => set((state) => ({
        modals: { ...state.modals, [modalId]: true }
    })),

    closeModal: (modalId) => set((state) => ({
        modals: { ...state.modals, [modalId]: false }
    }))
}));
