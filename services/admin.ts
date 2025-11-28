import { supabase } from '../lib/supabase';
import { CourtOwner, AdminStats, BookingManagement, RevenueData, CourtFormData, CourtDetails } from '../types/admin';
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

            // Calculate real occupancy rate
            let occupancyRate = 0;
            if (courtIds.length > 0 && courts && courts.length > 0) {
                // Calculate occupancy for the month
                const { data: courtsWithHours } = await supabase
                    .from('courts')
                    .select('id, open_time, close_time')
                    .in('id', courtIds);

                if (courtsWithHours && courtsWithHours.length > 0) {
                    // Total available hours across all courts for the month
                    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
                    let totalAvailableHours = 0;

                    courtsWithHours.forEach(court => {
                        const openHour = parseInt(court.open_time?.split(':')[0] || '6');
                        const closeHour = parseInt(court.close_time?.split(':')[0] || '22');
                        const dailyHours = closeHour - openHour;
                        totalAvailableHours += dailyHours * daysInMonth;
                    });

                    // Get all bookings for the month
                    const { data: monthBookings } = await supabase
                        .from('bookings')
                        .select('start_time, end_time')
                        .in('court_id', courtIds)
                        .gte('created_at', startOfMonth.toISOString())
                        .in('status', ['active', 'completed']);

                    let totalBookedHours = 0;
                    if (monthBookings && monthBookings.length > 0) {
                        monthBookings.forEach((booking: any) => {
                            const duration = (new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / (1000 * 60 * 60);
                            totalBookedHours += duration;
                        });
                    }

                    occupancyRate = totalAvailableHours > 0
                        ? Math.round((totalBookedHours / totalAvailableHours) * 100)
                        : 0;
                }
            }

            return {
                success: true,
                data: {
                    totalCourts: courtsCount || 0,
                    totalBookings: bookingsCount,
                    monthlyRevenue: revenue,
                    occupancyRate
                }
            };
        } catch (e) {
            console.error('getStats error:', e);
            return { success: false, data: null as any, error: 'Failed to fetch stats' };
        }
    },

    // Get all courts for current owner
    getCourts: async (): Promise<ApiResponse<CourtDetails[]>> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, data: [], error: 'Not authenticated' };

            // Get court owner id
            const { data: owner } = await supabase
                .from('court_owners')
                .select('id')
                .eq('profile_id', user.id)
                .single();

            if (!owner) {
                return { success: false, data: [], error: 'Court owner profile not found' };
            }

            // Get courts
            const { data: courts, error } = await supabase
                .from('courts')
                .select('*')
                .eq('owner_id', owner.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('getCourts error:', error);
                return { success: false, data: [], error: error.message };
            }

            // Transform to CourtDetails (simplified for now, can add stats later)
            const courtDetails: CourtDetails[] = (courts || []).map(court => ({
                id: court.id,
                ownerId: court.owner_id,
                name: court.name,
                address: court.address,
                description: court.description,
                pricePerHour: court.price_per_hour,
                openTime: court.open_time || '06:00',
                closeTime: court.close_time || '22:00',
                facilities: court.facilities || [],
                images: court.images || [],
                thumbnailUrl: court.thumbnail_url || (court.images?.[0] || ''),
                status: court.status,
                isActive: court.is_active ?? true,
                autoApproveBookings: court.auto_approve_bookings ?? true,
                rating: court.rating || 0,
                totalReviews: court.total_reviews || 0,
                totalBookings: 0, // TODO: Calculate from bookings
                monthlyRevenue: 0, // TODO: Calculate from bookings
                createdAt: court.created_at,
                updatedAt: court.updated_at
            }));

            return { success: true, data: courtDetails };
        } catch (e) {
            console.error('getCourts error:', e);
            return { success: false, data: [], error: 'Failed to fetch courts' };
        }
    },

    // Get court by ID
    getCourtById: async (courtId: string): Promise<ApiResponse<CourtDetails | null>> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, data: null, error: 'Not authenticated' };

            const { data: court, error } = await supabase
                .from('courts')
                .select('*')
                .eq('id', courtId)
                .single();

            if (error) {
                console.error('getCourtById error:', error);
                return { success: false, data: null, error: error.message };
            }

            // Verify ownership
            const { data: owner } = await supabase
                .from('court_owners')
                .select('id')
                .eq('profile_id', user.id)
                .single();

            if (!owner || court.owner_id !== owner.id) {
                return { success: false, data: null, error: 'Unauthorized' };
            }

            const courtDetail: CourtDetails = {
                id: court.id,
                ownerId: court.owner_id,
                name: court.name,
                address: court.address,
                description: court.description,
                pricePerHour: court.price_per_hour,
                openTime: court.open_time || '06:00',
                closeTime: court.close_time || '22:00',
                facilities: court.facilities || [],
                images: court.images || [],
                thumbnailUrl: court.thumbnail_url || (court.images?.[0] || ''),
                status: court.status,
                isActive: court.is_active ?? true,
                autoApproveBookings: court.auto_approve_bookings ?? true,
                rating: court.rating || 0,
                totalReviews: court.total_reviews || 0,
                totalBookings: 0,
                monthlyRevenue: 0,
                createdAt: court.created_at,
                updatedAt: court.updated_at
            };

            return { success: true, data: courtDetail };
        } catch (e) {
            console.error('getCourtById error:', e);
            return { success: false, data: null, error: 'Failed to fetch court' };
        }
    },

    // Create new court
    createCourt: async (formData: CourtFormData): Promise<ApiResponse<CourtDetails>> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, data: null as any, error: 'Not authenticated' };

            // Get court owner id
            const { data: owner } = await supabase
                .from('court_owners')
                .select('id')
                .eq('profile_id', user.id)
                .single();

            if (!owner) {
                return { success: false, data: null as any, error: 'Court owner profile not found' };
            }

            // Insert court
            const { data: court, error } = await supabase
                .from('courts')
                .insert({
                    owner_id: owner.id,
                    name: formData.name,
                    address: formData.address,
                    description: formData.description,
                    price_per_hour: formData.pricePerHour,
                    open_time: formData.openTime,
                    close_time: formData.closeTime,
                    facilities: formData.facilities,
                    images: formData.images,
                    thumbnail_url: formData.images[0] || '',
                    status: formData.isActive ? 'available' : 'maintenance',
                    is_active: formData.isActive,
                    auto_approve_bookings: formData.autoApproveBookings,
                    distance_km: 0, // Default value
                    rating: 0
                })
                .select()
                .single();

            if (error) {
                console.error('createCourt error:', error);
                return { success: false, data: null as any, error: error.message };
            }

            const courtDetail: CourtDetails = {
                id: court.id,
                ownerId: court.owner_id,
                name: court.name,
                address: court.address,
                description: court.description,
                pricePerHour: court.price_per_hour,
                openTime: court.open_time,
                closeTime: court.close_time,
                facilities: court.facilities || [],
                images: court.images || [],
                thumbnailUrl: court.thumbnail_url,
                status: court.status,
                isActive: court.is_active,
                autoApproveBookings: court.auto_approve_bookings,
                rating: 0,
                totalReviews: 0,
                totalBookings: 0,
                monthlyRevenue: 0,
                createdAt: court.created_at,
                updatedAt: court.updated_at
            };

            return { success: true, data: courtDetail };
        } catch (e) {
            console.error('createCourt error:', e);
            return { success: false, data: null as any, error: 'Failed to create court' };
        }
    },

    // Update court
    updateCourt: async (courtId: string, formData: CourtFormData): Promise<ApiResponse<CourtDetails>> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, data: null as any, error: 'Not authenticated' };

            // Verify ownership
            const { data: owner } = await supabase
                .from('court_owners')
                .select('id')
                .eq('profile_id', user.id)
                .single();

            if (!owner) {
                return { success: false, data: null as any, error: 'Court owner profile not found' };
            }

            // Update court
            const { data: court, error } = await supabase
                .from('courts')
                .update({
                    name: formData.name,
                    address: formData.address,
                    description: formData.description,
                    price_per_hour: formData.pricePerHour,
                    open_time: formData.openTime,
                    close_time: formData.closeTime,
                    facilities: formData.facilities,
                    images: formData.images,
                    thumbnail_url: formData.images[0] || '',
                    status: formData.isActive ? 'available' : 'maintenance',
                    is_active: formData.isActive,
                    auto_approve_bookings: formData.autoApproveBookings
                })
                .eq('id', courtId)
                .eq('owner_id', owner.id)
                .select()
                .single();

            if (error) {
                console.error('updateCourt error:', error);
                return { success: false, data: null as any, error: error.message };
            }

            const courtDetail: CourtDetails = {
                id: court.id,
                ownerId: court.owner_id,
                name: court.name,
                address: court.address,
                description: court.description,
                pricePerHour: court.price_per_hour,
                openTime: court.open_time,
                closeTime: court.close_time,
                facilities: court.facilities || [],
                images: court.images || [],
                thumbnailUrl: court.thumbnail_url,
                status: court.status,
                isActive: court.is_active,
                autoApproveBookings: court.auto_approve_bookings,
                rating: court.rating || 0,
                totalReviews: court.total_reviews || 0,
                totalBookings: 0,
                monthlyRevenue: 0,
                createdAt: court.created_at,
                updatedAt: court.updated_at
            };

            return { success: true, data: courtDetail };
        } catch (e) {
            console.error('updateCourt error:', e);
            return { success: false, data: null as any, error: 'Failed to update court' };
        }
    },

    // Delete court
    deleteCourt: async (courtId: string): Promise<ApiResponse<null>> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, data: null, error: 'Not authenticated' };

            // Verify ownership
            const { data: owner } = await supabase
                .from('court_owners')
                .select('id')
                .eq('profile_id', user.id)
                .single();

            if (!owner) {
                return { success: false, data: null, error: 'Court owner profile not found' };
            }

            // Delete court
            const { error } = await supabase
                .from('courts')
                .delete()
                .eq('id', courtId)
                .eq('owner_id', owner.id);

            if (error) {
                console.error('deleteCourt error:', error);
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: null };
        } catch (e) {
            console.error('deleteCourt error:', e);
            return { success: false, data: null, error: 'Failed to delete court' };
        }
    },

    // Get bookings for current owner's courts
    getBookings: async (filters?: {
        courtId?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<ApiResponse<BookingManagement[]>> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, data: [], error: 'Not authenticated' };

            // Get court owner id
            const { data: owner } = await supabase
                .from('court_owners')
                .select('id')
                .eq('profile_id', user.id)
                .single();

            if (!owner) {
                return { success: false, data: [], error: 'Court owner profile not found' };
            }

            // Get courts owned by this owner
            const { data: courts } = await supabase
                .from('courts')
                .select('id')
                .eq('owner_id', owner.id);

            const courtIds = courts?.map(c => c.id) || [];

            if (courtIds.length === 0) {
                return { success: true, data: [] };
            }

            // Build query for bookings
            let query = supabase
                .from('bookings')
                .select(`
                    *,
                    courts!inner(name),
                    profiles!inner(name, phone, avatar),
                    packages(name, type)
                `)
                .in('court_id', courtIds)
                .order('start_time', { ascending: false });

            // Apply filters
            if (filters?.courtId) {
                query = query.eq('court_id', filters.courtId);
            }
            if (filters?.status) {
                query = query.eq('status', filters.status);
            }
            if (filters?.startDate) {
                const startTimestamp = new Date(filters.startDate).getTime();
                query = query.gte('start_time', startTimestamp);
            }
            if (filters?.endDate) {
                const endTimestamp = new Date(filters.endDate).getTime();
                query = query.lte('end_time', endTimestamp);
            }

            const { data: bookings, error } = await query;

            if (error) {
                console.error('getBookings error:', error);
                return { success: false, data: [], error: error.message };
            }

            // Transform to BookingManagement
            const bookingManagement: BookingManagement[] = (bookings || []).map((booking: any) => ({
                id: booking.id,
                userId: booking.user_id,
                courtId: booking.court_id,
                courtName: booking.courts?.name || 'Unknown Court',
                packageId: booking.package_id,
                packageName: booking.packages?.name || 'Unknown Package',
                packageType: booking.packages?.type,
                playerName: booking.profiles?.name || 'Unknown Player',
                playerPhone: booking.profiles?.phone || '',
                playerAvatar: booking.profiles?.avatar,
                startTime: booking.start_time,
                endTime: booking.end_time,
                status: booking.status,
                totalAmount: booking.total_amount,
                createdAt: booking.created_at,
                notes: booking.notes
            }));

            return { success: true, data: bookingManagement };
        } catch (e) {
            console.error('getBookings error:', e);
            return { success: false, data: [], error: 'Failed to fetch bookings' };
        }
    },

    // Get booking by ID
    getBookingById: async (bookingId: string): Promise<ApiResponse<BookingManagement | null>> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, data: null, error: 'Not authenticated' };

            const { data: booking, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    courts!inner(name, owner_id),
                    profiles!inner(name, phone, avatar),
                    packages(name, type)
                `)
                .eq('id', bookingId)
                .single();

            if (error) {
                console.error('getBookingById error:', error);
                return { success: false, data: null, error: error.message };
            }

            // Verify ownership
            const { data: owner } = await supabase
                .from('court_owners')
                .select('id')
                .eq('profile_id', user.id)
                .single();

            if (!owner || booking.courts.owner_id !== owner.id) {
                return { success: false, data: null, error: 'Unauthorized' };
            }

            const bookingDetail: BookingManagement = {
                id: booking.id,
                userId: booking.user_id,
                courtId: booking.court_id,
                courtName: booking.courts?.name || 'Unknown Court',
                packageId: booking.package_id,
                packageName: booking.packages?.name || 'Unknown Package',
                packageType: booking.packages?.type,
                playerName: booking.profiles?.name || 'Unknown Player',
                playerPhone: booking.profiles?.phone || '',
                playerAvatar: booking.profiles?.avatar,
                startTime: booking.start_time,
                endTime: booking.end_time,
                status: booking.status,
                totalAmount: booking.total_amount,
                createdAt: booking.created_at,
                notes: booking.notes
            };

            return { success: true, data: bookingDetail };
        } catch (e) {
            console.error('getBookingById error:', e);
            return { success: false, data: null, error: 'Failed to fetch booking' };
        }
    },

    // Approve/Confirm booking
    approveBooking: async (bookingId: string): Promise<ApiResponse<BookingManagement>> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, data: null as any, error: 'Not authenticated' };

            // Verify ownership first
            const bookingRes = await AdminService.getBookingById(bookingId);
            if (!bookingRes.success) {
                return { success: false, data: null as any, error: bookingRes.error };
            }

            // Update status to confirmed
            const { data: booking, error } = await supabase
                .from('bookings')
                .update({ status: 'confirmed' })
                .eq('id', bookingId)
                .select(`
                    *,
                    courts!inner(name),
                    profiles!inner(name, phone, avatar),
                    packages(name, type)
                `)
                .single();

            if (error) {
                console.error('approveBooking error:', error);
                return { success: false, data: null as any, error: error.message };
            }

            const bookingDetail: BookingManagement = {
                id: booking.id,
                userId: booking.user_id,
                courtId: booking.court_id,
                courtName: booking.courts?.name || 'Unknown Court',
                packageId: booking.package_id,
                packageName: booking.packages?.name || 'Unknown Package',
                packageType: booking.packages?.type,
                playerName: booking.profiles?.name || 'Unknown Player',
                playerPhone: booking.profiles?.phone || '',
                playerAvatar: booking.profiles?.avatar,
                startTime: booking.start_time,
                endTime: booking.end_time,
                status: booking.status,
                totalAmount: booking.total_amount,
                createdAt: booking.created_at,
                notes: booking.notes
            };

            return { success: true, data: bookingDetail };
        } catch (e) {
            console.error('approveBooking error:', e);
            return { success: false, data: null as any, error: 'Failed to approve booking' };
        }
    },

    // Cancel booking
    cancelBooking: async (bookingId: string, reason?: string): Promise<ApiResponse<BookingManagement>> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, data: null as any, error: 'Not authenticated' };

            // Verify ownership first
            const bookingRes = await AdminService.getBookingById(bookingId);
            if (!bookingRes.success) {
                return { success: false, data: null as any, error: bookingRes.error };
            }

            // Update status to cancelled
            const updateData: any = { status: 'cancelled' };
            if (reason) {
                updateData.notes = reason;
            }

            const { data: booking, error } = await supabase
                .from('bookings')
                .update(updateData)
                .eq('id', bookingId)
                .select(`
                    *,
                    courts!inner(name),
                    profiles!inner(name, phone, avatar),
                    packages(name, type)
                `)
                .single();

            if (error) {
                console.error('cancelBooking error:', error);
                return { success: false, data: null as any, error: error.message };
            }

            const bookingDetail: BookingManagement = {
                id: booking.id,
                userId: booking.user_id,
                courtId: booking.court_id,
                courtName: booking.courts?.name || 'Unknown Court',
                packageId: booking.package_id,
                packageName: booking.packages?.name || 'Unknown Package',
                packageType: booking.packages?.type,
                playerName: booking.profiles?.name || 'Unknown Player',
                playerPhone: booking.profiles?.phone || '',
                playerAvatar: booking.profiles?.avatar,
                startTime: booking.start_time,
                endTime: booking.end_time,
                status: booking.status,
                totalAmount: booking.total_amount,
                createdAt: booking.created_at,
                notes: booking.notes
            };

            return { success: true, data: bookingDetail };
        } catch (e) {
            console.error('cancelBooking error:', e);
            return { success: false, data: null as any, error: 'Failed to cancel booking' };
        }
    }
};
