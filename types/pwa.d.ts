declare module 'virtual:pwa-register/react' {
    export interface RegisterSWOptions {
        immediate?: boolean;
        onNeedRefresh?: () => void;
        onOfflineReady?: () => void;
        onRegistered?: (r: any) => void;
        onRegisterError?: (error: any) => void;
    }

    export function useRegisterSW(options?: RegisterSWOptions): {
        needRefresh: [boolean, (value: boolean) => void];
        offlineReady: [boolean, (value: boolean) => void];
        updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
    };
}
