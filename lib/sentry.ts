import * as Sentry from "@sentry/react";

export const initSentry = () => {
    // Only initialize in production or if SENTRY_DSN is provided
    const dsn = import.meta.env.VITE_SENTRY_DSN;

    if (!dsn) {
        console.log('Sentry DSN not configured. Skipping error monitoring setup.');
        return;
    }

    Sentry.init({
        dsn,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: false,
                blockAllMedia: false,
            }),
        ],

        // Performance Monitoring
        tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev

        // Session Replay
        replaysSessionSampleRate: 0.1, // Sample 10% of normal sessions
        replaysOnErrorSampleRate: 1.0, // Sample 100% of sessions with errors

        environment: import.meta.env.MODE,

        beforeSend(event, hint) {
            // Filter out non-critical errors
            const error = hint.originalException;

            // Ignore ResizeObserver loop errors (common browser quirk)
            if (error && typeof error === 'object' && 'message' in error) {
                const message = (error as Error).message;
                if (message?.includes('ResizeObserver')) {
                    return null;
                }

                // Ignore network errors in development
                if (import.meta.env.MODE === 'development' && message?.includes('NetworkError')) {
                    return null;
                }
            }

            return event;
        },

        // Ignore specific errors
        ignoreErrors: [
            'ResizeObserver loop',
            'Non-Error promise rejection',
            'Network request failed',
            'Failed to fetch',
        ],
    });
};

// Helper function to capture exceptions manually
export const captureException = (error: Error, context?: Record<string, any>) => {
    if (import.meta.env.VITE_SENTRY_DSN) {
        Sentry.captureException(error, {
            extra: context,
        });
    } else {
        console.error('Error captured:', error, context);
    }
};

// Helper function to capture messages
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
    if (import.meta.env.VITE_SENTRY_DSN) {
        Sentry.captureMessage(message, level);
    } else {
        console.log(`[${level}] ${message}`);
    }
};

// Helper to set user context
export const setUser = (userId: string, email?: string, username?: string) => {
    if (import.meta.env.VITE_SENTRY_DSN) {
        Sentry.setUser({
            id: userId,
            email,
            username,
        });
    }
};

// Helper to clear user context
export const clearUser = () => {
    if (import.meta.env.VITE_SENTRY_DSN) {
        Sentry.setUser(null);
    }
};
