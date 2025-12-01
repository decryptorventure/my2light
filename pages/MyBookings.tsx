import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, Clock, MapPin, XCircle, Edit3, Navigation } from 'lucide-react';
import { PageTransition } from '../components/Layout/PageTransition';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { CancelBookingModal } from '../components/modals/CancelBookingModal';
import { RescheduleModal } from '../components/modals/RescheduleModal';
import { useToast } from '../components/ui/Toast';
import { bookingsService } from '../src/api';
import { Booking } from '../types';

type TabType = 'upcoming' | 'past' | 'cancelled';

export const MyBookings: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('upcoming');
    const [bookings, setBookings] = useState<Booking[]>([]);

    // Modal states
    const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; booking: Booking | null }>({
        isOpen: false,
        booking: null,
    });
    const [rescheduleModal, setRescheduleModal] = useState<{ isOpen: boolean; booking: Booking | null }>({
        isOpen: false,
        booking: null,
    });

    useEffect(() => {
        const fetchBookings = async () => {
            setLoading(true);
            const res = await bookingsService.getBookingHistory();
            if (res.success) {
                setBookings(res.data);
            }
            setLoading(false);
        };
        fetchBookings();
    }, []);

    // Filter bookings by tab
    const now = Date.now();
    const upcomingBookings = bookings.filter(
        b => b.status === 'active' && b.startTime > now
    );
    const pastBookings = bookings.filter(
        b => b.status === 'completed' && b.endTime < now
    );
    const cancelledBookings = bookings.filter(
        b => b.status === 'cancelled'
    );

    const getActiveBookings = () => {
        switch (activeTab) {
            case 'upcoming':
                return upcomingBookings;
            case 'past':
                return pastBookings;
            case 'cancelled':
                return cancelledBookings;
            default:
                return [];
        }
    };

    const activeBookings = getActiveBookings();

    // Cancel booking handler
    const handleCancelBooking = async (reason?: string) => {
        if (!cancelModal.booking) return;

        const res = await bookingsService.cancelBooking(cancelModal.booking.id, reason);
        if (res.success) {
            showToast('Đã hủy đặt sân. Tiền sẽ hoàn lại trong 24h', 'success');
            // Update local state
            setBookings(prev =>
                prev.map(b =>
                    b.id === cancelModal.booking!.id ? { ...b, status: 'cancelled' as const } : b
                )
            );
            setCancelModal({ isOpen: false, booking: null });
        } else {
            showToast(res.error || 'Không thể hủy đặt sân', 'error');
        }
    };

    // Reschedule booking handler  
    const handleRescheduleBooking = async (newDate: Date, newTime: string) => {
        if (!rescheduleModal.booking) return;

        const [hours, minutes] = newTime.split(':').map(Number);
        const startTime = new Date(newDate);
        startTime.setHours(hours, minutes, 0, 0);

        const res = await bookingsService.rescheduleBooking(
            rescheduleModal.booking.id,
            startTime.getTime()
        );

        if (res.success) {
            showToast('Đã đổi lịch thành công!', 'success');
            // Update local state
            setBookings(prev =>
                prev.map(b =>
                    b.id === rescheduleModal.booking!.id ? res.data : b
                )
            );
            setRescheduleModal({ isOpen: false, booking: null });
        } else {
            showToast(res.error || 'Không thể đổi lịch', 'error');
        }
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-slate-900 pb-24">
                {/* Header */}
                <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 pt-safe">
                    <div className="flex items-center justify-between px-4 py-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <h1 className="text-lg font-bold">Lịch Đặt Sân</h1>
                        <div className="w-10" /> {/* Spacer */}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 px-4 pb-3">
                        {[
                            { key: 'upcoming', label: 'Sắp tới', count: upcomingBookings.length },
                            { key: 'past', label: 'Đã chơi', count: pastBookings.length },
                            { key: 'cancelled', label: 'Đã hủy', count: cancelledBookings.length },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as TabType)}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key
                                    ? 'bg-lime-400 text-slate-900'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                {tab.label}
                                {tab.count > 0 && <span className="ml-1">({tab.count})</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <LoadingSpinner />
                        </div>
                    ) : activeBookings.length === 0 ? (
                        <EmptyState
                            icon={activeTab === 'upcoming' ? Calendar : activeTab === 'past' ? Clock : XCircle}
                            title={
                                activeTab === 'upcoming'
                                    ? 'Chưa có lịch đặt sân'
                                    : activeTab === 'past'
                                        ? 'Chưa có lịch sử'
                                        : 'Chưa có đặt sân bị hủy'
                            }
                            description={
                                activeTab === 'upcoming'
                                    ? 'Đặt sân ngay để bắt đầu chơi!'
                                    : activeTab === 'past'
                                        ? 'Lịch sử các trận đã chơi sẽ hiển thị ở đây'
                                        : 'Các đặt sân bị hủy sẽ hiển thị ở đây'
                            }
                            actionLabel={activeTab === 'upcoming' ? 'Đặt sân ngay' : undefined}
                            onAction={activeTab === 'upcoming' ? () => navigate('/home') : undefined}
                        />
                    ) : (
                        <div className="space-y-3">
                            {activeBookings.map((booking) => (
                                <BookingCard
                                    key={booking.id}
                                    booking={booking}
                                    type={activeTab}
                                    onCancel={() => setCancelModal({ isOpen: true, booking })}
                                    onReschedule={() => setRescheduleModal({ isOpen: true, booking })}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {cancelModal.booking && (
                <CancelBookingModal
                    isOpen={cancelModal.isOpen}
                    onClose={() => setCancelModal({ isOpen: false, booking: null })}
                    onConfirm={handleCancelBooking}
                    bookingInfo={{
                        courtName: cancelModal.booking.courtName || 'Sân',
                        date: new Date(cancelModal.booking.startTime).toLocaleDateString('vi-VN'),
                        time: new Date(cancelModal.booking.startTime).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                        }),
                        amount: cancelModal.booking.totalAmount,
                    }}
                />
            )}

            {rescheduleModal.booking && (
                <RescheduleModal
                    isOpen={rescheduleModal.isOpen}
                    onClose={() => setRescheduleModal({ isOpen: false, booking: null })}
                    onConfirm={handleRescheduleBooking}
                    currentBooking={{
                        courtName: rescheduleModal.booking.courtName || 'Sân',
                        date: new Date(rescheduleModal.booking.startTime).toLocaleDateString('vi-VN'),
                        time: new Date(rescheduleModal.booking.startTime).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                        }),
                    }}
                />
            )}
        </PageTransition>
    );
};

// Booking Card Component
interface BookingCardProps {
    booking: Booking;
    type: TabType;
    onCancel: () => void;
    onReschedule: () => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, type, onCancel, onReschedule }) => {
    const navigate = useNavigate();
    const startDate = new Date(booking.startTime);
    const endDate = new Date(booking.endTime);

    // Countdown for upcoming bookings
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (type !== 'upcoming') return;

        const updateCountdown = () => {
            const now = Date.now();
            const diff = booking.startTime - now;

            if (diff <= 0) {
                setTimeLeft('Bắt đầu ngay');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (hours > 24) {
                const days = Math.floor(hours / 24);
                setTimeLeft(`${days} ngày nữa`);
            } else if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m nữa`);
            } else {
                setTimeLeft(`${minutes} phút nữa`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [booking.startTime, type]);

    return (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            {/* Court Info */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h3 className="font-bold text-white mb-1">{booking.courtName}</h3>
                    <p className="text-sm text-slate-400">{booking.packageName}</p>
                </div>
                {type === 'upcoming' && timeLeft && (
                    <div className="bg-lime-400 text-slate-900 px-3 py-1 rounded-full text-xs font-bold">
                        {timeLeft}
                    </div>
                )}
            </div>

            {/* Time Info */}
            <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>
                        {startDate.toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                        })}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>
                        {startDate.toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {endDate.toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>
                </div>
            </div>

            {/* Amount */}
            <div className="flex justify-between items-center py-3 border-t border-slate-700">
                <span className="text-slate-400 text-sm">Tổng cộng</span>
                <span className="text-lg font-bold text-lime-400">
                    {booking.totalAmount.toLocaleString()}đ
                </span>
            </div>

            {/* Actions */}
            {type === 'upcoming' && (
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={() => {
                            // Open Google Maps with court location
                            window.open(`https://maps.google.com/?q=${booking.courtName}`, '_blank');
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Navigation size={16} />
                        Chỉ đường
                    </button>
                    <button
                        onClick={onReschedule}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Edit3 size={16} />
                        Đổi lịch
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg text-sm font-medium transition-colors"
                    >
                        <XCircle size={16} />
                        Hủy
                    </button>
                </div>
            )}

            {type === 'past' && (
                <button
                    onClick={() => navigate('/my-highlights')}
                    className="w-full mt-3 py-2 bg-lime-400 hover:bg-lime-300 text-slate-900 rounded-lg text-sm font-bold transition-colors"
                >
                    Xem highlight
                </button>
            )}
        </div>
    );
};
