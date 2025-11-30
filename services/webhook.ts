import crypto from 'crypto';
import { supabase } from '../lib/supabase';

/**
 * Webhook Security Service
 * Handles HMAC signature verification for payment webhooks
 */

/**
 * Verify webhook signature using HMAC SHA-256
 * 
 * @param payload - Raw webhook payload (as string)
 * @param signature - Signature from webhook header
 * @param secret - Webhook secret key
 * @returns boolean - true if signature is valid
 */
export const verifyWebhookSignature = (
    payload: string,
    signature: string,
    secret: string
): boolean => {
    try {
        // Generate HMAC hash
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(payload);
        const expectedSignature = hmac.digest('hex');

        // Constant-time comparison to prevent timing attacks
        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature),
            Buffer.from(signature)
        );
    } catch (error) {
        console.error('[Webhook] Signature verification error:', error);
        return false;
    }
};

/**
 * Handle payment webhook
 * Verifies signature and processes payment result
 * 
 * @param payload - Webhook payload object
 * @param signature - Signature from header
 * @returns Promise with success status and optional error
 */
export const handlePaymentWebhook = async (
    payload: any,
    signature: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        // Get webhook secret from environment
        const webhookSecret = import.meta.env.VITE_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error('[Webhook] Webhook secret not configured');
            return { success: false, error: 'Webhook secret not configured' };
        }

        // Verify signature
        const payloadString = JSON.stringify(payload);
        const isValid = verifyWebhookSignature(payloadString, signature, webhookSecret);

        if (!isValid) {
            console.error('[Webhook] Invalid signature');
            return { success: false, error: 'Invalid webhook signature' };
        }

        console.log('[Webhook] Signature verified, processing payment:', payload);

        // Process payment based on status
        if (payload.status === 'success' || payload.status === 'completed') {
            // Update booking status to confirmed
            const { error: updateError } = await supabase
                .from('bookings')
                .update({
                    status: 'confirmed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', payload.bookingId);

            if (updateError) {
                console.error('[Webhook] Failed to update booking:', updateError);
                return { success: false, error: updateError.message };
            }

            // Send notification to user
            await sendBookingNotification(payload.bookingId, 'confirmed');

            console.log('[Webhook] Payment processed successfully:', payload.bookingId);
            return { success: true };
        } else if (payload.status === 'failed') {
            // Update booking status to cancelled
            const { error: updateError } = await supabase
                .from('bookings')
                .update({
                    status: 'cancelled',
                    notes: 'Payment failed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', payload.bookingId);

            if (updateError) {
                console.error('[Webhook] Failed to update booking:', updateError);
                return { success: false, error: updateError.message };
            }

            // Send notification to user
            await sendBookingNotification(payload.bookingId, 'cancelled');

            console.log('[Webhook] Payment failed, booking cancelled:', payload.bookingId);
            return { success: true };
        }

        return { success: true };
    } catch (error: any) {
        console.error('[Webhook] Processing error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send booking notification to user
 * 
 * @param bookingId - Booking ID
 * @param type - Notification type ('confirmed' | 'cancelled' | 'rescheduled')
 */
export const sendBookingNotification = async (
    bookingId: string,
    type: 'confirmed' | 'cancelled' | 'rescheduled'
): Promise<void> => {
    try {
        // Get booking details
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select(`
        *,
        courts (name),
        profiles (name)
      `)
            .eq('id', bookingId)
            .single();

        if (fetchError || !booking) {
            console.error('[Webhook] Failed to fetch booking for notification:', fetchError);
            return;
        }

        // Prepare notification content
        const notifications = {
            confirmed: {
                type: 'booking_confirmed',
                title: 'Đặt sân thành công! 🎉',
                body: `Bạn đã đặt sân ${booking.courts?.name} thành công`,
                data: { bookingId, courtId: booking.court_id }
            },
            cancelled: {
                type: 'booking_cancelled',
                title: 'Đặt sân đã bị hủy',
                body: `Đặt sân tại ${booking.courts?.name} đã được hủy`,
                data: { bookingId, courtId: booking.court_id }
            },
            rescheduled: {
                type: 'booking_rescheduled',
                title: 'Đã đổi lịch đặt sân',
                body: `Lịch đặt sân tại ${booking.courts?.name} đã được cập nhật`,
                data: { bookingId, courtId: booking.court_id }
            }
        };

        const notification = notifications[type];

        // Insert notification
        const { error: insertError } = await supabase
            .from('notifications')
            .insert({
                user_id: booking.user_id,
                type: notification.type,
                title: notification.title,
                body: notification.body,
                data: notification.data,
                read: false
            });

        if (insertError) {
            console.error('[Webhook] Failed to create notification:', insertError);
        } else {
            console.log('[Webhook] Notification sent:', type, bookingId);
        }
    } catch (error) {
        console.error('[Webhook] Notification error:', error);
    }
};

/**
 * Validate webhook payload structure
 * 
 * @param payload - Webhook payload to validate
 * @returns boolean - true if payload is valid
 */
export const validateWebhookPayload = (payload: any): boolean => {
    // Required fields
    const requiredFields = ['bookingId', 'status', 'amount'];

    for (const field of requiredFields) {
        if (!(field in payload)) {
            console.error('[Webhook] Missing required field:', field);
            return false;
        }
    }

    // Validate status
    const validStatuses = ['success', 'completed', 'failed', 'pending'];
    if (!validStatuses.includes(payload.status)) {
        console.error('[Webhook] Invalid status:', payload.status);
        return false;
    }

    // Validate booking ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(payload.bookingId)) {
        console.error('[Webhook] Invalid booking ID format:', payload.bookingId);
        return false;
    }

    return true;
};
