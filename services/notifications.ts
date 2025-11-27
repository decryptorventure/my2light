// Notification service for Firebase Cloud Messaging
// Handles permission requests, token management, and message handling

import { isFirebaseConfigured } from '../lib/firebase';

export interface NotificationPermissionResult {
    granted: boolean;
    token?: string;
    error?: string;
}

export class NotificationService {
    private static token: string | null = null;
    private static isInitialized = false;

    // Request notification permission
    static async requestPermission(): Promise<NotificationPermissionResult> {
        try {
            // Check if Firebase is configured
            if (!isFirebaseConfigured()) {
                console.warn('Firebase not configured, using mock mode');
                return {
                    granted: true,
                    token: `mock-token-${Date.now()}`,
                };
            }

            // Check if browser supports notifications
            if (!('Notification' in window)) {
                return {
                    granted: false,
                    error: 'Trình duyệt không hỗ trợ thông báo',
                };
            }

            // Check if permission is already granted
            if (Notification.permission === 'granted') {
                const token = await this.getToken();
                return {
                    granted: true,
                    token: token || undefined,
                };
            }

            // Request permission
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                const token = await this.getToken();
                return {
                    granted: true,
                    token: token || undefined,
                };
            } else {
                return {
                    granted: false,
                    error: 'Người dùng từ chối quyền thông báo',
                };
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return {
                granted: false,
                error: 'Không thể yêu cầu quyền thông báo',
            };
        }
    }

    // Get FCM token
    private static async getToken(): Promise<string | null> {
        try {
            if (!isFirebaseConfigured()) {
                console.warn('Firebase not configured, using mock token');
                this.token = `mock-token-${Date.now()}`;
                return this.token;
            }

            // Get real FCM token from Firebase
            const { messaging } = await import('../lib/firebase');
            if (!messaging) {
                console.error('Firebase messaging not initialized');
                return null;
            }

            const { getToken } = await import('firebase/messaging');
            const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

            if (!vapidKey) {
                console.error('VAPID key not configured');
                return null;
            }

            const token = await getToken(messaging, { vapidKey });
            this.token = token;
            console.log('✅ FCM Token obtained:', token);

            return token;
        } catch (error) {
            console.error('Error getting FCM token:', error);
            return null;
        }
    }

    // Save token to backend
    static async saveTokenToBackend(userId: string, token: string): Promise<boolean> {
        try {
            // In production, save to Supabase users table
            console.log('Saving FCM token for user:', userId, token);
            // await supabase.from('users').update({ fcm_token: token }).eq('id', userId);
            return true;
        } catch (error) {
            console.error('Error saving token:', error);
            return false;
        }
    }

    // Send notification (for testing)
    static async sendTestNotification(title: string, body: string): Promise<void> {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
            });
        }
    }

    // Listen for foreground messages
    static listenForMessages(callback: (payload: any) => void): void {
        if (!isFirebaseConfigured()) return;

        import('../lib/firebase').then(({ messaging }) => {
            if (!messaging) return;

            import('firebase/messaging').then(({ onMessage }) => {
                onMessage(messaging, (payload) => {
                    console.log('📨 Message received:', payload);
                    callback(payload);
                });
            });
        });
    }

    // Schedule booking reminder (1 hour before)
    static async scheduleBookingReminder(bookingId: string, startTime: number): Promise<void> {
        const reminderTime = startTime - 60 * 60 * 1000; // 1 hour before
        const now = Date.now();

        if (reminderTime > now) {
            const delay = reminderTime - now;

            // In production, this should be handled by backend cron jobs
            // For now, simulate with setTimeout (not reliable for long periods)
            console.log(`Would schedule reminder for booking ${bookingId} in ${delay}ms`);

            // setTimeout(() => {
            //   this.sendTestNotification(
            //     'Nhắc nhở đặt sân',
            //     'Trận đấu của bạn sẽ bắt đầu trong 1 giờ nữa!'
            //   );
            // }, delay);
        }
    }

    // Initialize notification listener
    static initialize(): void {
        if (this.isInitialized) return;

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                console.log('Received message from service worker:', event.data);

                // Handle notification click
                if (event.data.type === 'notification-click') {
                    const { url } = event.data;
                    if (url) {
                        window.location.href = url;
                    }
                }
            });
        }

        this.isInitialized = true;
    }
}

// Initialize on module load
NotificationService.initialize();
