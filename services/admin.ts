import { supabase } from '../lib/supabase';
import { CourtOwner, AdminStats, BookingManagement, RevenueData } from '../types/admin';
import { ApiResponse } from '../types';

export const AdminService = {
    // Get current court owner profile
    getCourtOwnerProfile: async (): Promise<ApiResponse<CourtOwner | null>> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, data: null, error: 'Not authenticated' };

            const { data, error } = await supabase
                .from('court_owners')
                .select('*')
                .eq('profile_id', user.id)
                .single();

            if (error) {
                // Not found is OK - user might not be a court owner yet
                if (error.code === 'PGRST116') {
                    return { success: true, data: null };
                }
                return { success: false, data: null, error: error.message };
            }

            const courtOwner: CourtOwner = {
                id: data.id,
                profileId: data.profile_id,
                businessName: data.business_name,
                taxId: data.tax_id,
                phone: data.phone,
                email: data.email,
                address: data.address,
                bankAccount: data.bank_account,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            };

            return { success: true, data: courtOwner };
        } catch (e) {
            console.error('getCourtOwnerProfile error:', e);
            return { success: false, data: null, error: 'Failed to fetch court owner profile' };
        }
    },

    // Create court owner profile
    createCourtOwnerProfile: async (data: {
        businessName: string;
        phone: string;
        email: string;
        address?: string;
        taxId?: string;
    }): Promise<ApiResponse<CourtOwner>> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, data: null as any, error: 'Not authenticated' };

            // Insert court owner profile
            const { data: ownerData, error: ownerError } = await supabase
                .from('court_owners')
                .insert({
                    profile_id: user.id,
                    business_name: data.businessName,
                    phone: data.phone,
                    email: data.email,
                    address: data.address,
                    tax_id: data.taxId
                })
                .select()
                .single();

            if (ownerError) {
                console.error('Create court owner error:', ownerError);
                return { success: false, data: null as any, error: ownerError.message };
            }

            // Update user role to court_owner
            const { error: roleError } = await supabase
                .from('profiles')
                .update({ role: 'court_owner' })
                .eq('id', user.id);

            if (roleError) {
                console.error('Update role error:', roleError);
            }

            return { success: true, data: ownerData as any };
        } catch (e) {
            console.error('createCourtOwnerProfile error:', e);
            return { success: false, data: null as any, error: 'Failed to create court owner profile' };
        }
    },

    // Get dashboard stats
    getStats: async (): Promise<ApiResponse<AdminStats>> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, data: null as any, error: 'Not authenticated' };

            // Get court owner
            const { data: owner } = await supabase
                .from('court_owners')
                .select('id')
                .eq('profile_id', user.id)
                .single();

            if (!owner) {
                return { success: false, data: null as any, error: 'Court owner profile not found' };
            }

            // Get courts count
            const { count: courtsCount } = await supabase
                .from('courts')
                .select('*', { count: 'exact', head: true })
                .eq('owner_id', owner.id);

            // Get bookings count (this month)
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { data: courts } = await supabase
                .from('courts')
                .select('id')
                .eq('owner_id', owner.id);

            const courtIds = courts?.map(c => c.id) || [];

            let bookingsCount = 0;
            let revenue = 0;

            if (courtIds.length > 0) {
                const { count } = await supabase
                    .from('bookings')
                    .select('*', { count: 'exact', head: true })
                    .in('court_id', courtIds)
                    .gte('created_at', startOfMonth.toISOString());

                bookingsCount = count || 0;

                // Calculate revenue
                const { data: bookings } = await supabase
                    .from('bookings')
                    .select('total_amount')
                    .in('court_id', courtIds)
                    .gte('created_at', startOfMonth.toISOString())
                    .eq('status', 'completed');

                revenue = bookings?.reduce((sum, b) => sum + b.total_amount, 0) || 0;
            }

            return {
                success: true,
                data: {
                    totalCourts: courtsCount || 0,
                    totalBookings: bookingsCount,
                    monthlyRevenue: revenue,
                    occupancyRate: 75 // TODO: Calculate real occupancy rate
                }
            };
        } catch (e) {
            console.error('getStats error:', e);
            return { success: false, data: null as any, error: 'Failed to fetch stats' };
        }
    }
};
