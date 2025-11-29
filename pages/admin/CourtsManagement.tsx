import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { CourtFormModal } from '../../components/admin/CourtFormModal';
import { AdminService } from '../../services/admin';
import { CourtDetails } from '../../types/admin';
import { useToast } from '../../components/ui/Toast';
import { useAdminCourts, useDeleteCourt } from '../../hooks/useApi';
import { Building2, Plus, Edit2, Trash2, MapPin, DollarSign, Clock, MoreVertical, Star } from 'lucide-react';

import { VenueControl } from '../../components/admin/VenueControl';

export const CourtsManagement: React.FC = () => {
    const { showToast } = useToast();

    // React Query Hooks
    const { data: courts = [], isLoading, refetch } = useAdminCourts();
    const deleteCourtMutation = useDeleteCourt();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCourt, setEditingCourt] = useState<CourtDetails | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const loading = isLoading;

    const handleAdd = () => {
        setEditingCourt(null);
        setIsFormOpen(true);
    };

    const handleEdit = (court: CourtDetails) => {
        setEditingCourt(court);
        setIsFormOpen(true);
    };

    const handleDelete = async (courtId: string) => {
        if (!confirm('Bạn có chắc muốn xóa sân này?')) return;

        setDeletingId(courtId);
        try {
            await deleteCourtMutation.mutateAsync(courtId);
            showToast('Đã xóa sân thành công', 'success');
        } catch (error: any) {
            showToast(error.message || 'Không thể xóa sân', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const handleFormSuccess = () => {
        setIsFormOpen(false);
        setEditingCourt(null);
        refetch(); // Refresh list after add/edit
    };

    const getStatusBadge = (status: string, isActive: boolean) => {
        if (!isActive) {
            return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-700 text-slate-400 border border-slate-600">Tạm ngưng</span>;
        }

        const statusConfig: Record<string, { bg: string; text: string; label: string; border: string }> = {
            live: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Hoạt động', border: 'border-green-500/20' },
            available: { bg: 'bg-lime-500/10', text: 'text-lime-400', label: 'Sẵn sàng', border: 'border-lime-500/20' },
            busy: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'Đang bận', border: 'border-yellow-500/20' },
            maintenance: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Bảo trì', border: 'border-red-500/20' }
        };

        const config = statusConfig[status] || statusConfig.available;
        return <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${config.bg} ${config.text} border ${config.border}`}>{config.label}</span>;
    };

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Quản lý Sân</h1>
                    <p className="text-slate-400">Quản lý và theo dõi trạng thái các sân của bạn</p>
                </div>
                <Button onClick={handleAdd} size="lg" className="shadow-lg shadow-lime-400/20">
                    <Plus size={20} className="mr-2" />
                    Thêm sân mới
                </Button>
            </div>

            {/* Venue Camera Control */}
            <VenueControl />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-lime-400/10 flex items-center justify-center border border-lime-400/20">
                            <Building2 size={24} className="text-lime-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-400">Tổng số sân</p>
                            <p className="text-3xl font-bold text-white mt-1">{courts.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                            <DollarSign size={24} className="text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-400">Giá trung bình</p>
                            <p className="text-3xl font-bold text-white mt-1">
                                {courts.length > 0
                                    ? Math.round(courts.reduce((sum, c) => sum + c.pricePerHour, 0) / courts.length).toLocaleString()
                                    : 0}đ
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <Star size={24} className="text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-400">Đánh giá TB</p>
                            <p className="text-3xl font-bold text-white mt-1">
                                {courts.length > 0
                                    ? (courts.reduce((sum, c) => sum + c.rating, 0) / courts.length).toFixed(1)
                                    : '0.0'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Courts Grid */}
            {courts.length === 0 ? (
                <div className="bg-slate-800/50 border border-dashed border-slate-700 rounded-3xl p-16 text-center">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Building2 size={40} className="text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Chưa có sân nào</h3>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto">
                        Hãy bắt đầu kinh doanh bằng cách thêm sân pickleball đầu tiên của bạn vào hệ thống.
                    </p>
                    <Button onClick={handleAdd} size="lg">
                        <Plus size={20} className="mr-2" />
                        Thêm sân đầu tiên
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {courts.map((court) => (
                        <div
                            key={court.id}
                            className="group bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-lime-400/50 transition-all duration-300 hover:shadow-2xl hover:shadow-lime-400/10 hover:-translate-y-1"
                        >
                            {/* Image Header */}
                            <div className="relative h-48 bg-slate-900 overflow-hidden">
                                {court.thumbnailUrl ? (
                                    <img
                                        src={court.thumbnailUrl}
                                        alt={court.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                        <Building2 size={48} className="text-slate-700" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
                                <div className="absolute top-4 right-4">
                                    {getStatusBadge(court.status, court.isActive)}
                                </div>
                                <div className="absolute bottom-4 left-4 right-4">
                                    <h3 className="text-xl font-bold text-white truncate shadow-sm">{court.name}</h3>
                                    <div className="flex items-center gap-1 text-slate-300 text-sm mt-1">
                                        <MapPin size={14} className="text-lime-400" />
                                        <span className="truncate">{court.address}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-slate-900/50 rounded-lg p-3">
                                        <p className="text-xs text-slate-500 mb-1">Giá thuê</p>
                                        <p className="text-lg font-bold text-lime-400">
                                            {court.pricePerHour.toLocaleString()}đ<span className="text-xs font-normal text-slate-500">/h</span>
                                        </p>
                                    </div>
                                    <div className="bg-slate-900/50 rounded-lg p-3">
                                        <p className="text-xs text-slate-500 mb-1">Giờ mở cửa</p>
                                        <p className="text-sm font-semibold text-white flex items-center gap-1.5 mt-1">
                                            <Clock size={14} className="text-blue-400" />
                                            {court.openTime} - {court.closeTime}
                                        </p>
                                    </div>
                                </div>

                                {/* Facilities Tags */}
                                {court.facilities && court.facilities.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-6 h-16 overflow-hidden content-start">
                                        {court.facilities.slice(0, 5).map((facility, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 text-xs font-medium rounded bg-slate-700/50 text-slate-300 border border-slate-700"
                                            >
                                                {facility}
                                            </span>
                                        ))}
                                        {court.facilities.length > 5 && (
                                            <span className="px-2 py-1 text-xs font-medium rounded bg-slate-700/50 text-slate-400 border border-slate-700">
                                                +{court.facilities.length - 5}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pt-4 border-t border-slate-700">
                                    <button
                                        onClick={() => handleEdit(court)}
                                        className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Edit2 size={16} />
                                        Chỉnh sửa
                                    </button>
                                    <button
                                        onClick={() => handleDelete(court.id)}
                                        disabled={deletingId === court.id}
                                        className="w-12 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors flex items-center justify-center disabled:opacity-50"
                                    >
                                        {deletingId === court.id ? (
                                            <LoadingSpinner size="sm" />
                                        ) : (
                                            <Trash2 size={18} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Form Modal */}
            {isFormOpen && (
                <CourtFormModal
                    court={editingCourt}
                    onClose={() => {
                        setIsFormOpen(false);
                        setEditingCourt(null);
                    }}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
};
