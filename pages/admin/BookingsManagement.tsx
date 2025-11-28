import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { BookingDetailModal } from '../../components/admin/BookingDetailModal';
import { AdminService } from '../../services/admin';
import { BookingManagement } from '../../types/admin';
import { useToast } from '../../components/ui/Toast';
import { Calendar, Filter, Search, CheckCircle, XCircle, Clock, DollarSign, User } from 'lucide-react';

export const BookingsManagement: React.FC = () => {
    const { showToast } = useToast();
    const [bookings, setBookings] = useState<BookingManagement[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<BookingManagement[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<BookingManagement | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        loadBookings();
    }, []);

    useEffect(() => {
        filterBookings();
    }, [bookings, searchTerm, statusFilter]);

    const loadBookings = async () => {
        setLoading(true);
        const res = await AdminService.getBookings();
        if (res.success) {
            setBookings(res.data);
        } else {
            showToast(res.error || 'Không thể tải danh sách booking', 'error');
        }
        setLoading(false);
    };

    const filterBookings = () => {
        let filtered = bookings;

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(b => b.status === statusFilter);
        }

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(b =>
                b.playerName.toLowerCase().includes(term) ||
                b.courtName.toLowerCase().includes(term) ||
                b.playerPhone.includes(term)
            );
        }

        setFilteredBookings(filtered);
    };

    const handleApprove = async (bookingId: string) => {
        setActionLoading(bookingId);
        const res = await AdminService.approveBooking(bookingId);
        setActionLoading(null);

        if (res.success) {
            showToast('Đã duyệt booking thành công', 'success');
            loadBookings();
        } else {
            showToast(res.error || 'Không thể duyệt booking', 'error');
        }
    };

    const handleCancel = async (bookingId: string) => {
        if (!confirm('Bạn có chắc muốn hủy booking này?')) return;

        setActionLoading(bookingId);
        const res = await AdminService.cancelBooking(bookingId, 'Cancelled by court owner');
        setActionLoading(null);

        if (res.success) {
            showToast('Đã hủy booking thành công', 'success');
            loadBookings();
        } else {
            showToast(res.error || 'Không thể hủy booking', 'error');
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { bg: string; text: string; label: string; icon: any }> = {
            pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Chờ duyệt', icon: Clock },
            confirmed: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Đã duyệt', icon: CheckCircle },
            completed: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Hoàn thành', icon: CheckCircle },
            cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Đã hủy', icon: XCircle }
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <span className={`px-3 py-1 text-xs rounded-full ${config.bg} ${config.text} flex items-center gap-1 w-fit`}>
                <Icon size={14} />
                {config.label}
            </span>
        );
    };

    const formatDateTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        completed: bookings.filter(b => b.status === 'completed').length
    };

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Quản lý Booking</h1>
                <p className="text-slate-400">Xem và quản lý tất cả đơn đặt sân</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Calendar size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Tổng booking</p>
                            <p className="text-xl font-bold text-white">{stats.total}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                            <Clock size={20} className="text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Chờ duyệt</p>
                            <p className="text-xl font-bold text-white">{stats.pending}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <CheckCircle size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Đã duyệt</p>
                            <p className="text-xl font-bold text-white">{stats.confirmed}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <CheckCircle size={20} className="text-green-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Hoàn thành</p>
                            <p className="text-xl font-bold text-white">{stats.completed}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên, SĐT, sân..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-lime-400"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <Filter size={20} className="text-slate-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-lime-400"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="pending">Chờ duyệt</option>
                            <option value="confirmed">Đã duyệt</option>
                            <option value="completed">Hoàn thành</option>
                            <option value="cancelled">Đã hủy</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Bookings List */}
            {filteredBookings.length === 0 ? (
                <Card className="p-12 text-center">
                    <Calendar size={48} className="mx-auto text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                        {bookings.length === 0 ? 'Chưa có booking nào' : 'Không tìm thấy booking'}
                    </h3>
                    <p className="text-slate-400">
                        {bookings.length === 0
                            ? 'Các booking sẽ xuất hiện ở đây khi khách hàng đặt sân'
                            : 'Thử thay đổi bộ lọc hoặc tìm kiếm'}
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredBookings.map((booking) => (
                        <Card key={booking.id} className="p-5 hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                    {booking.playerAvatar ? (
                                        <img src={booking.playerAvatar} alt={booking.playerName} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={24} className="text-slate-400" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-1">{booking.playerName}</h3>
                                            <p className="text-sm text-slate-400">{booking.playerPhone}</p>
                                        </div>
                                        {getStatusBadge(booking.status)}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Sân</p>
                                            <p className="text-sm font-semibold text-white">{booking.courtName}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Thời gian</p>
                                            <p className="text-sm font-semibold text-white">
                                                {formatDateTime(booking.startTime)}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Gói & Giá</p>
                                            <p className="text-sm font-semibold text-white">{booking.packageName}</p>
                                            <p className="text-sm font-semibold text-lime-400">
                                                {booking.totalAmount.toLocaleString()}đ
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSelectedBooking(booking)}
                                            className="px-3 py-1.5 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors text-sm font-semibold"
                                        >
                                            Chi tiết
                                        </button>

                                        {booking.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(booking.id)}
                                                    disabled={actionLoading === booking.id}
                                                    className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm font-semibold disabled:opacity-50 flex items-center gap-1"
                                                >
                                                    <CheckCircle size={14} />
                                                    {actionLoading === booking.id ? 'Đang duyệt...' : 'Duyệt'}
                                                </button>
                                                <button
                                                    onClick={() => handleCancel(booking.id)}
                                                    disabled={actionLoading === booking.id}
                                                    className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-semibold disabled:opacity-50 flex items-center gap-1"
                                                >
                                                    <XCircle size={14} />
                                                    Hủy
                                                </button>
                                            </>
                                        )}

                                        {(booking.status === 'confirmed' || booking.status === 'completed') && (
                                            <button
                                                onClick={() => handleCancel(booking.id)}
                                                disabled={actionLoading === booking.id}
                                                className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-semibold disabled:opacity-50"
                                            >
                                                {actionLoading === booking.id ? 'Đang hủy...' : 'Hủy booking'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {selectedBooking && (
                <BookingDetailModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                    onApprove={handleApprove}
                    onCancel={handleCancel}
                    actionLoading={actionLoading}
                />
            )}
        </div>
    );
};
