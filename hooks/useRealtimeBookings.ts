import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Real-time booking updates hook
 * Listens to Supabase Realtime for booking changes and invalidates queries
 * 
 * @param courtId - Optional court ID to listen to specific court bookings
 * @param enabled - Whether to enable real-time updates (default: true)
 */
export const useRealtimeBookings = (courtId?: string, enabled: boolean = true) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!enabled) return;

        console.log('[Realtime] Setting up booking subscription', { courtId });

        // Create channel for bookings
        const channel = supabase.channel(courtId ? `bookings:court_${courtId}` : 'bookings:all');

        // Listen to all booking changes
        const subscription = channel
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'bookings',
                    ...(courtId ? { filter: `court_id=eq.${courtId}` } : {})
                },
                (payload) => {
                    console.log('[Realtime] Booking change detected:', payload);

                    // Invalidate relevant queries to trigger refetch
                    if (courtId) {
                        // Specific court queries
                        queryClient.invalidateQueries(['court-availability', courtId]);
                        queryClient.invalidateQueries(['court-bookings', courtId]);
                        queryClient.invalidateQueries(['court', courtId]);
                    } else {
                        // All bookings queries
                        queryClient.invalidateQueries(['bookings']);
                        queryClient.invalidateQueries(['my-bookings']);
                    }

                    // Admin queries (if user is admin)
                    queryClient.invalidateQueries(['admin-bookings']);
                    queryClient.invalidateQueries(['admin-stats']);

                    // Show notification based on event type
                    const eventType = payload.eventType;
                    const booking = payload.new || payload.old;

                    if (eventType === 'INSERT') {
                        console.log('[Realtime] New booking created:', booking?.id);
                    } else if (eventType === 'UPDATE') {
                        console.log('[Realtime] Booking updated:', booking?.id);
                    } else if (eventType === 'DELETE') {
                        console.log('[Realtime] Booking deleted:', booking?.id);
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[Realtime] Successfully subscribed to bookings');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('[Realtime] Channel error');
                } else if (status === 'TIMED_OUT') {
                    console.error('[Realtime] Subscription timed out');
                }
            });

        // Cleanup on unmount
        return () => {
            console.log('[Realtime] Cleaning up booking subscription');
            supabase.removeChannel(channel);
        };
    }, [courtId, enabled, queryClient]);
};

/**
 * Real-time court availability hook
 * Listens for booking changes that affect court availability
 * 
 * @param courtId - Court ID to monitor
 */
export const useRealtimeAvailability = (courtId: string) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!courtId) return;

        console.log('[Realtime] Setting up availability monitoring for court:', courtId);

        const channel = supabase
            .channel(`availability:court_${courtId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `court_id=eq.${courtId}`
                },
                (payload) => {
                    console.log('[Realtime] Availability changed for court:', courtId);

                    // Invalidate availability queries
                    queryClient.invalidateQueries(['court-availability', courtId]);
                    queryClient.invalidateQueries(['court-time-slots', courtId]);

                    // Optionally update cache optimistically
                    const booking = payload.new as any;
                    if (payload.eventType === 'INSERT' && booking) {
                        // New booking created - mark time slot as unavailable
                        console.log('[Realtime] Time slot booked:', {
                            start: booking.start_time,
                            end: booking.end_time
                        });
                    } else if (payload.eventType === 'DELETE') {
                        // Booking cancelled - mark time slot as available
                        const deletedBooking = payload.old as any;
                        console.log('[Realtime] Time slot freed:', {
                            start: deletedBooking?.start_time,
                            end: deletedBooking?.end_time
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [courtId, queryClient]);
};

/**
 * Real-time notification hook for bookings
 * Listens for bookings related to current user
 * 
 * @param userId - Current user ID
 */
export const useRealtimeUserBookings = (userId?: string) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!userId) return;

        console.log('[Realtime] Setting up user booking notifications for:', userId);

        const channel = supabase
            .channel(`user_bookings:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    console.log('[Realtime] User booking updated:', payload);

                    // Invalidate user's booking queries
                    queryClient.invalidateQueries(['my-bookings']);
                    queryClient.invalidateQueries(['booking', (payload.new as any)?.id]);

                    // Show user-friendly notification
                    const booking = payload.new as any;
                    const eventType = payload.eventType;

                    if (eventType === 'UPDATE') {
                        // Status might have changed (pending -> confirmed)
                        if (booking?.status === 'confirmed') {
                            console.log('[Realtime] Booking confirmed!', booking.id);
                            // Could trigger toast notification here
                        } else if (booking?.status === 'cancelled') {
                            console.log('[Realtime] Booking cancelled', booking.id);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, queryClient]);
};
