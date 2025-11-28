import { supabase } from '../lib/supabase';
import type { ApiResponse } from '../types';
import type {
    RevenueDataPoint,
    PeakHoursData,
    PeakHoursInsight,
    CustomerInsight,
    SmartRecommendation,
    CustomerPrediction,
} from '../types/social';

// =====================================================
// ANALYTICS SERVICE
// Court owner analytics with predictive insights
// =====================================================

export const AnalyticsService = {
    /**
     * Get revenue analytics with daily/weekly/monthly grouping
     */
    getRevenueAnalytics: async (
        startDate: string,
        endDate: string,
        groupBy: 'day' | 'week' | 'month' = 'day'
    ): Promise<ApiResponse<RevenueDataPoint[]>> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, data: [], error: 'Not authenticated' };
            }

            // Get court owner profile
            const { data: owner } = await supabase
                .from('court_owners')
                .select('id')
                .eq('profile_id', user.id)
                .single();

            if (!owner) {
                return { success: false, data: [], error: 'Not a court owner' };
            }

            // Get all bookings for owner's courts within date range
            const { data: bookings, error } = await supabase
                .from('bookings')
                .select(`
                    id,
                    total_amount,
                    start_time,
                    court_id,
                    courts!inner(owner_id)
                `)
                .eq('courts.owner_id', owner.id)
                .gte('start_time', startDate)
                .lte('start_time', endDate)
                .in('status', ['confirmed', 'completed']);

            if (error) {
                return { success: false, data: [], error: error.message };
            }

            // Group by date
            const grouped = groupBookingsByDate(bookings || [], groupBy);

            return { success: true, data: grouped };
        } catch (error: any) {
            return { success: false, data: [], error: error.message };
        }
    },

    /**
     * Get court performance comparison
     */
    getCourtPerformance: async (
        startDate: string,
        endDate: string
    ): Promise<ApiResponse<any[]>> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, data: [], error: 'Not authenticated' };
            }

            const { data: owner } = await supabase
                .from('court_owners')
                .select('id')
                .eq('profile_id', user.id)
                .single();

            if (!owner) {
                return { success: false, data: [], error: 'Not a court owner' };
            }

            // Get all courts with their bookings
            const { data: courts, error } = await supabase
                .from('courts')
                .select(`
                    id,
                    name,
                    price_per_hour,
                    rating,
                    total_reviews,
                    bookings!inner(
                        id,
                        total_amount,
                        start_time,
                        end_time,
                        status
                    )
                `)
                .eq('owner_id', owner.id);

            if (error) {
                return { success: false, data: [], error: error.message };
            }

            // Calculate metrics per court
            const performance = courts?.map(court => {
                const confirmedBookings = (court.bookings || []).filter((b: any) =>
                    b.status === 'confirmed' || b.status === 'completed'
                );

                const totalRevenue = confirmedBookings.reduce(
                    (sum: number, b: any) => sum + (b.total_amount || 0),
                    0
                );

                const totalHours = confirmedBookings.reduce((sum: number, b: any) => {
                    const start = new Date(b.start_time);
                    const end = new Date(b.end_time);
                    return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                }, 0);

                // Assume court is available 14 hours/day (8 AM - 10 PM)
                const daysInPeriod = Math.ceil(
                    (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                const availableHours = daysInPeriod * 14;
                const occupancyRate = (totalHours / availableHours) * 100;

                const revenuePerHour = totalHours > 0 ? totalRevenue / totalHours : 0;

                return {
                    courtId: court.id,
                    courtName: court.name,
                    totalRevenue,
                    bookingsCount: confirmedBookings.length,
                    occupancyRate: Math.min(occupancyRate, 100), // Cap at 100%
                    averageRating: court.rating || 0,
                    totalReviews: court.total_reviews || 0,
                    revenuePerHour,
                    pricePerHour: court.price_per_hour,
                };
            }) || [];

            return { success: true, data: performance };
        } catch (error: any) {
            return { success: false, data: [], error: error.message };
        }
    },

    /**
     * Get peak hours heatmap data
     */
    getPeakHoursData: async (
        courtId?: string,
        last30Days: boolean = true
    ): Promise<ApiResponse<{ data: PeakHoursData[], insights: PeakHoursInsight }>> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, data: { data: [], insights: {} as any }, error: 'Not authenticated' };
            }

            const { data: owner } = await supabase
                .from('court_owners')
                .select('id')
                .eq('profile_id', user.id)
                .single();

            if (!owner) {
                return { success: false, data: { data: [], insights: {} as any }, error: 'Not a court owner' };
            }

            // Date range
            const endDate = new Date();
            const startDate = new Date();
            if (last30Days) {
                startDate.setDate(startDate.getDate() - 30);
            } else {
                startDate.setDate(startDate.getDate() - 90);
            }

            // Get bookings
            let query = supabase
                .from('bookings')
                .select(`
                    start_time,
                    end_time,
                    total_amount,
                    status,
                    court_id,
                    courts!inner(owner_id)
                `)
                .eq('courts.owner_id', owner.id)
                .gte('start_time', startDate.toISOString())
                .lte('start_time', endDate.toISOString())
                .in('status', ['confirmed', 'completed']);

            if (courtId) {
                query = query.eq('court_id', courtId);
            }

            const { data: bookings, error } = await query;

            if (error) {
                return { success: false, data: { data: [], insights: {} as any }, error: error.message };
            }

            // Group by day of week and hour
            const heatmapData = generateHeatmapData(bookings || []);
            const insights = generatePeakHoursInsights(heatmapData);

            return { success: true, data: { data: heatmapData, insights } };
        } catch (error: any) {
            return { success: false, data: { data: [], insights: {} as any }, error: error.message };
        }
    },

    /**
     * Get customer insights
     */
    getCustomerInsights: async (): Promise<ApiResponse<CustomerInsight>> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, data: null as any, error: 'Not authenticated' };
            }

            const { data: owner } = await supabase
                .from('court_owners')
                .select('id')
                .eq('profile_id', user.id)
                .single();

            if (!owner) {
                return { success: false, data: null as any, error: 'Not a court owner' };
            }

            // Get all bookings with user info
            const { data: bookings, error } = await supabase
                .from('bookings')
                .select(`
                    id,
                    user_id,
                    total_amount,
                    created_at,
                    courts!inner(owner_id),
                    profiles!inner(id, name, avatar)
                `)
                .eq('courts.owner_id', owner.id)
                .in('status', ['confirmed', 'completed']);

            if (error) {
                return { success: false, data: null as any, error: error.message };
            }

            const insights = calculateCustomerInsights(bookings || []);

            return { success: true, data: insights };
        } catch (error: any) {
            return { success: false, data: null as any, error: error.message };
        }
    },

    /**
     * Get smart recommendations using simple predictive logic
     */
    getSmartRecommendations: async (): Promise<ApiResponse<SmartRecommendation[]>> => {
        try {
            // Get court performance data
            const endDate = new Date().toISOString();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);

            const performanceRes = await AnalyticsService.getCourtPerformance(
                startDate.toISOString(),
                endDate
            );

            const peakHoursRes = await AnalyticsService.getPeakHoursData(undefined, true);

            if (!performanceRes.success || !peakHoursRes.success) {
                return { success: false, data: [], error: 'Failed to fetch analytics data' };
            }

            const recommendations = generateSmartRecommendations(
                performanceRes.data,
                peakHoursRes.data
            );

            return { success: true, data: recommendations };
        } catch (error: any) {
            return { success: false, data: [], error: error.message };
        }
    },

    /**
     * Get customer predictions (likely to book, churn risk, VIP potential)
     */
    getCustomerPredictions: async (): Promise<ApiResponse<CustomerPrediction[]>> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, data: [], error: 'Not authenticated' };
            }

            const { data: owner } = await supabase
                .from('court_owners')
                .select('id')
                .eq('profile_id', user.id)
                .single();

            if (!owner) {
                return { success: false, data: [], error: 'Not a court owner' };
            }

            // Get all customer bookings
            const { data: bookings, error } = await supabase
                .from('bookings')
                .select(`
                    id,
                    user_id,
                    start_time,
                    total_amount,
                    courts!inner(owner_id),
                    profiles!inner(id, name, avatar, phone)
                `)
                .eq('courts.owner_id', owner.id)
                .in('status', ['confirmed', 'completed'])
                .order('start_time', { ascending: false });

            if (error) {
                return { success: false, data: [], error: error.message };
            }

            const predictions = generateCustomerPredictions(bookings || []);

            return { success: true, data: predictions };
        } catch (error: any) {
            return { success: false, data: [], error: error.message };
        }
    },
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function groupBookingsByDate(
    bookings: any[],
    groupBy: 'day' | 'week' | 'month'
): RevenueDataPoint[] {
    const grouped: Record<string, { revenue: number; count: number }> = {};

    bookings.forEach(booking => {
        const date = new Date(booking.start_time);
        let key: string;

        if (groupBy === 'day') {
            key = date.toISOString().split('T')[0];
        } else if (groupBy === 'week') {
            const week = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000));
            key = `week-${week}`;
        } else {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        if (!grouped[key]) {
            grouped[key] = { revenue: 0, count: 0 };
        }

        grouped[key].revenue += booking.total_amount || 0;
        grouped[key].count += 1;
    });

    return Object.entries(grouped)
        .map(([date, data]) => ({
            date,
            revenue: data.revenue,
            bookingsCount: data.count,
            averageBookingValue: data.count > 0 ? data.revenue / data.count : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

function generateHeatmapData(bookings: any[]): PeakHoursData[] {
    const heatmap: Record<string, { count: number; revenue: number }> = {};

    bookings.forEach(booking => {
        const start = new Date(booking.start_time);
        const dayOfWeek = start.getDay();
        const hour = start.getHours();
        const key = `${dayOfWeek}-${hour}`;

        if (!heatmap[key]) {
            heatmap[key] = { count: 0, revenue: 0 };
        }

        heatmap[key].count += 1;
        heatmap[key].revenue += booking.total_amount || 0;
    });

    const result: PeakHoursData[] = [];
    for (let day = 0; day < 7; day++) {
        for (let hour = 6; hour <= 22; hour++) {
            const key = `${day}-${hour}`;
            const data = heatmap[key] || { count: 0, revenue: 0 };
            result.push({
                dayOfWeek: day,
                hour,
                bookingsCount: data.count,
                revenue: data.revenue,
            });
        }
    }

    return result;
}

function generatePeakHoursInsights(heatmapData: PeakHoursData[]): PeakHoursInsight {
    const sorted = [...heatmapData].sort((a, b) => b.bookingsCount - a.bookingsCount);
    const peak = sorted[0];
    const slow = sorted[sorted.length - 1];

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const peakHour = `${days[peak.dayOfWeek]} ${peak.hour}:00-${peak.hour + 1}:00`;
    const slowHour = `${days[slow.dayOfWeek]} ${slow.hour}:00-${slow.hour + 1}:00`;

    return {
        peakHour,
        peakBookings: peak.bookingsCount,
        slowHour,
        slowBookings: slow.bookingsCount,
        recommendation: `Consider offering a 20% discount during ${slowHour} to increase bookings`,
        expectedImpact: '+2-3 bookings per week',
    };
}

function calculateCustomerInsights(bookings: any[]): CustomerInsight {
    // Group by user
    const userBookings: Record<string, any[]> = {};
    bookings.forEach(b => {
        if (!userBookings[b.user_id]) {
            userBookings[b.user_id] = [];
        }
        userBookings[b.user_id].push(b);
    });

    // New vs returning (booked more than once)
    const newCustomers = Object.values(userBookings).filter(b => b.length === 1).length;
    const returningCustomers = Object.values(userBookings).filter(b => b.length > 1).length;

    const total = newCustomers + returningCustomers;

    // Top customers
    const topCustomers = Object.entries(userBookings)
        .map(([userId, bookings]) => ({
            userId,
            name: bookings[0].profiles.name,
            avatar: bookings[0].profiles.avatar,
            bookingsCount: bookings.length,
            totalSpent: bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0),
            lastBooking: bookings[bookings.length - 1].created_at,
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

    // Average frequency (bookings per customer per month)
    const avgBookingsPerCustomer = total > 0 ? bookings.length / total : 0;

    // Average CLV
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const averageCLV = total > 0 ? totalRevenue / total : 0;

    return {
        newCustomers,
        returningCustomers,
        newVsReturningPercent: {
            new: total > 0 ? (newCustomers / total) * 100 : 0,
            returning: total > 0 ? (returningCustomers / total) * 100 : 0,
        },
        topCustomers,
        averageBookingFrequency: avgBookingsPerCustomer,
        averageCustomerLifetimeValue: averageCLV,
    };
}

function generateSmartRecommendations(
    courtPerformance: any[],
    peakHoursData: { data: PeakHoursData[]; insights: PeakHoursInsight }
): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];

    // Recommendation 1: Low occupancy courts
    const lowOccupancyCourts = courtPerformance.filter(c => c.occupancyRate < 40);
    if (lowOccupancyCourts.length > 0) {
        const court = lowOccupancyCourts[0];
        recommendations.push({
            id: 'low-occupancy-1',
            type: 'pricing',
            title: 'Low Occupancy Detected',
            description: `${court.courtName} has only ${court.occupancyRate.toFixed(0)}% occupancy. Lower prices by 15% to boost bookings by ~30%.`,
            confidence: 85,
            expectedImpact: {
                revenue: 500000,
                bookings: 8,
                description: '+500K VND/month, +8 bookings',
            },
            action: {
                label: 'Adjust Price',
                type: 'adjust_price',
                data: { courtId: court.courtId, suggestedPrice: court.pricePerHour * 0.85 },
            },
            isDismissed: false,
            isApplied: false,
        });
    }

    // Recommendation 2: Peak hours promotion
    if (peakHoursData.insights) {
        recommendations.push({
            id: 'slow-hours-promo',
            type: 'capacity',
            title: 'Slow Hours Opportunity',
            description: peakHoursData.insights.recommendation,
            confidence: 78,
            expectedImpact: {
                bookings: 3,
                description: peakHoursData.insights.expectedImpact,
            },
            action: {
                label: 'Create Promotion',
                type: 'create_promotion',
                data: { timeSlot: peakHoursData.insights.slowHour, discount: 20 },
            },
            isDismissed: false,
            isApplied: false,
        });
    }

    return recommendations;
}

function generateCustomerPredictions(bookings: any[]): CustomerPrediction[] {
    // Group by user
    const userBookings: Record<string, any[]> = {};
    bookings.forEach(b => {
        if (!userBookings[b.user_id]) {
            userBookings[b.user_id] = [];
        }
        userBookings[b.user_id].push(b);
    });

    const predictions: CustomerPrediction[] = [];
    const now = Date.now();

    Object.entries(userBookings).forEach(([userId, bookings]) => {
        const sorted = bookings.sort(
            (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
        );
        const lastBooking = sorted[0];
        const daysSinceLastBooking =
            (now - new Date(lastBooking.start_time).getTime()) / (1000 * 60 * 60 * 24);

        // Calculate average days between bookings
        let totalDays = 0;
        for (let i = 0; i < sorted.length - 1; i++) {
            const diff =
                (new Date(sorted[i].start_time).getTime() -
                    new Date(sorted[i + 1].start_time).getTime()) /
                (1000 * 60 * 60 * 24);
            totalDays += diff;
        }
        const avgFrequency = sorted.length > 1 ? totalDays / (sorted.length - 1) : 30;

        const totalSpent = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

        // Prediction: Likely to book soon
        if (daysSinceLastBooking >= avgFrequency * 0.8 && daysSinceLastBooking <= avgFrequency * 1.2) {
            const probability = Math.min(100, Math.max(50, 100 - (daysSinceLastBooking / avgFrequency) * 20));
            predictions.push({
                userId,
                userName: lastBooking.profiles.name,
                userAvatar: lastBooking.profiles.avatar,
                userPhone: lastBooking.profiles.phone,
                predictionType: 'likely_to_book',
                probability,
                insight: `Books every ${avgFrequency.toFixed(0)} days. Last booking ${daysSinceLastBooking.toFixed(0)} days ago.`,
                lastBookingDate: lastBooking.start_time,
                averageFrequency: avgFrequency,
                totalBookings: bookings.length,
                totalSpent,
                suggestedAction: {
                    label: 'Send Reminder',
                    type: 'send_reminder',
                    message: `Hi ${lastBooking.profiles.name}, it's been a while! Ready for another match?`,
                },
            });
        }

        // Prediction: Churn risk
        if (bookings.length >= 3 && daysSinceLastBooking > avgFrequency * 1.5) {
            predictions.push({
                userId,
                userName: lastBooking.profiles.name,
                userAvatar: lastBooking.profiles.avatar,
                userPhone: lastBooking.profiles.phone,
                predictionType: 'churn_risk',
                probability: Math.min(95, Math.max(60, (daysSinceLastBooking / avgFrequency) * 40)),
                insight: `Used to book regularly (every ${avgFrequency.toFixed(0)} days) but hasn't booked in ${daysSinceLastBooking.toFixed(0)} days.`,
                lastBookingDate: lastBooking.start_time,
                averageFrequency: avgFrequency,
                totalBookings: bookings.length,
                totalSpent,
                suggestedAction: {
                    label: 'Send Win-back Offer',
                    type: 'send_offer',
                    message: `We miss you! Get 20% off your next booking. Book now!`,
                },
            });
        }

        // Prediction: VIP potential
        if (bookings.length >= 3 && daysSinceLastBooking < 14 && totalSpent > 1000000) {
            predictions.push({
                userId,
                userName: lastBooking.profiles.name,
                userAvatar: lastBooking.profiles.avatar,
                userPhone: lastBooking.profiles.phone,
                predictionType: 'vip_potential',
                probability: 90,
                insight: `Very active customer! ${bookings.length} bookings, ${(totalSpent / 1000).toFixed(0)}K VND spent.`,
                lastBookingDate: lastBooking.start_time,
                averageFrequency: avgFrequency,
                totalBookings: bookings.length,
                totalSpent,
                suggestedAction: {
                    label: 'Offer VIP Membership',
                    type: 'offer_loyalty',
                    message: `You're one of our top players! Would you like to join our VIP program?`,
                },
            });
        }
    });

    // Sort by probability
    return predictions.sort((a, b) => b.probability - a.probability).slice(0, 20);
}
