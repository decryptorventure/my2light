import React from 'react';
import { Modal } from '../ui/Modal';
import { BookingManagement } from '../../types/admin';
import { X, User, MapPin, Calendar, Clock, Package, DollarSign, CheckCircle, XCircle } from 'lucide-react';

interface BookingDetailModalProps {
    booking: BookingManagement;
    onClose: () => void;
    onApprove: (id: string) => void;
    onCancel: (id: string) => void;
    actionLoading: string | null;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
    booking,
    onClose,
    onApprove,
    onCancel,
    actionLoading
}) => {
    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'text-yellow-400',
            confirmed: 'text-blue-400',
            completed: 'text-green-400',
            cancelled: 'text-red-400'
        };
        return colors[status] || 'text-slate-400';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pending: 'Chờ duyệt',
            confirmed: 'Đã duyệt',
            completed: 'Hoàn thành',
            cancelled: 'Đã hủy'
        };
        return labels[status] || status;
    };

    const formatDateTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDuration = () => {
        const durationMs = booking.endTime - booking.startTime;
        const minutes = Math.floor(durationMs / 60000);
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    return (
        <Modal isOpen onClose={onClose}>
            <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Chi tiết Booking</h2>
                        <p className={`text-sm font-semibold ${getStatusColor(booking.status)}`}>
                            {getStatusLabel(booking.status)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Customer Info */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <User size={20} className="text-lime-400" />
                            Thông tin khách hàng
                        </h3>
                        <div className="flex items-center gap-4 p-4 bg-slate-900 rounded-lg">
                            <div className="w-16 h-16 rounded-full bg-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {booking.playerAvatar ? (
                                    <img
                                        src={booking.playerAvatar}
                                        alt={booking.playerName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User size={32} className="text-slate-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-lg font-semibold text-white">{booking.playerName}</p>
                                <p className="text-sm text-slate-400">{booking.playerPhone}</p>
                            </div>
                            <a
                                href={`tel:${booking.playerPhone}`}
                                className="px-4 py-2 bg-lime-400 text-slate-900 rounded-lg font-semibold hover:bg-lime-300 transition-colors text-sm"
                            >
                                Gọi điện
                            </a>
                        </div>
                    </div>

                    {/* Court Info */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <MapPin size={20} className="text-lime-400" />
                            Thông tin sân
                        </h3>
                        <div className="p-4 bg-slate-900 rounded-lg">
                            <p className="text-white font-semibold">{booking.courtName}</p>
                        </div>
                    </div>

                    {/* Booking Details */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-lime-400" />
                            Chi tiết đặt sân
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {/* Date & Time */}
                            <div className="p-4 bg-slate-900 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <Clock size={20} className="text-slate-400 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-400 mb-1">Ngày & Giờ</p>
                                        <p className="text-white font-semibold">{formatDateTime(booking.startTime)}</p>
                                        <p className="text-lime-400 font-semibold mt-1">
                                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                            <span className="text-slate-400 ml-2">({getDuration()})</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Package */}
                            <div className="p-4 bg-slate-900 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <Package size={20} className="text-slate-400 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-400 mb-1">Gói dịch vụ</p>
                                        <p className="text-white font-semibold">{booking.packageName}</p>
                                        {booking.packageType && (
                                            <span className="inline-block mt-1 px-2 py-1 text-xs rounded bg-slate-800 text-slate-300">
                                                {booking.packageType === 'full_match' ? 'Trận đấu đủ' : 'Tiêu chuẩn'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Amount */}
                            <div className="p-4 bg-slate-900 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <DollarSign size={20} className="text-slate-400 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-400 mb-1">Tổng tiền</p>
                                        <p className="text-2xl font-bold text-lime-400">
                                            {booking.totalAmount.toLocaleString()}đ
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {booking.notes && (
                                <div className="p-4 bg-slate-900 rounded-lg">
                                    <p className="text-sm text-slate-400 mb-1">Ghi chú</p>
                                    <p className="text-white">{booking.notes}</p>
                                </div>
                            )}

                            {/* Booking Date */}
                            <div className="p-4 bg-slate-900 rounded-lg">
                                <p className="text-sm text-slate-400 mb-1">Ngày đặt</p>
                                <p className="text-white">
                                    {new Date(booking.createdAt).toLocaleString('vi-VN', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                    <div className="p-6 border-t border-slate-700 flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-colors"
                        >
                            Đóng
                        </button>

                        {booking.status === 'pending' && (
                            <>
                                <button
                                    onClick={() => {
                                        onApprove(booking.id);
                                        onClose();
                                    }}
                                    disabled={actionLoading === booking.id}
                                    className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <CheckCircle size={20} />
                                    {actionLoading === booking.id ? 'Đang duyệt...' : 'Duyệt booking'}
                                </button>
                                <button
                                    onClick={() => {
                                        onCancel(booking.id);
                                        onClose();
                                    }}
                                    disabled={actionLoading === booking.id}
                                    className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <XCircle size={20} />
                                    Hủy booking
                                </button>
                            </>
                        )}

                        {booking.status === 'confirmed' && (
                            <button
                                onClick={() => {
                                    onCancel(booking.id);
                                    onClose();
                                }}
                                disabled={actionLoading === booking.id}
                                className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                <XCircle size={20} />
                                {actionLoading === booking.id ? 'Đang hủy...' : 'Hủy booking'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};
