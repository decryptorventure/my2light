import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { CourtFormModal } from '../../components/admin/CourtFormModal';
import { AdminService } from '../../services/admin';
import { CourtDetails } from '../../types/admin';
import { useToast } from '../../components/ui/Toast';
import { Building2, Plus, Edit2, Trash2, MapPin, DollarSign, Clock, ToggleLeft, ToggleRight } from 'lucide-react';

export const CourtsManagement: React.FC = () => {
    const { showToast } = useToast();
    const [courts, setCourts] = useState<CourtDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCourt, setEditingCourt] = useState<CourtDetails | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        loadCourts();
    }, []);

    const loadCourts = async () => {
        setLoading(true);
        const res = await AdminService.getCourts();
        if (res.success) {
            setCourts(res.data);
        } else {
            showToast(res.error || 'Không thể tải danh sách sân', 'error');
        }
        setLoading(false);
    };

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
        const res = await AdminService.deleteCourt(courtId);
        setDeletingId(null);

        if (res.success) {
            showToast('Đã xóa sân thành công', 'success');
            loadCourts();
        } else {
            showToast(res.error || 'Không thể xóa sân', 'error');
        }
    };

    const handleFormSuccess = () => {
        setIsFormOpen(false);
        setEditingCourt(null);
        loadCourts();
    };

    const getStatusBadge = (status: string, isActive: boolean) => {
        if (!isActive) {
            return <span className="px-2 py-1 text-xs rounded-full bg-slate-700 text-slate-400">Tạm ngưng</span>;
        }

        const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
            live: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Đang hoạt động' },
            available: { bg: 'bg-lime-500/20', text: 'text-lime-400', label: 'Sẵn sàng' },
            busy: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Đang bận' },
            maintenance: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Bảo trì' }
        };

        const config = statusConfig[status] || statusConfig.available;
        return <span className={`px-2 py-1 text-xs rounded-full ${config.bg} ${config.text}`}>{config.label}</span>;
    };

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Quản lý Sân</h1>
                    <p className="text-slate-400">Quản lý danh sách sân pickleball của bạn</p>
                </div>
                <Button onClick={handleAdd} size="lg">
                    <Plus size={20} className="mr-2" />
                    Thêm sân mới
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-lime-500/20 flex items-center justify-center">
                            <Building2 size={20} className="text-lime-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Tổng sân</p>
                            <p className="text-2xl font-bold text-white">{courts.length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <ToggleRight size={20} className="text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Đang hoạt động</p>
                            <p className="text-2xl font-bold text-white">
                                {courts.filter(c => c.isActive).length}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                            <DollarSign size={20} className="text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Giá trung bình</p>
                            <p className="text-2xl font-bold text-white">
                                {courts.length > 0
                                    ? Math.round(courts.reduce((sum, c) => sum + c.pricePerHour, 0) / courts.length).toLocaleString()
                                    : 0}đ
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Courts List */}
            {courts.length === 0 ? (
                <Card className="p-12 text-center">
                    <Building2 size={48} className="mx-auto text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Chưa có sân nào</h3>
                    <p className="text-slate-400 mb-6">Bắt đầu bằng cách thêm sân đầu tiên của bạn</p>
                    <Button onClick={handleAdd}>
                        <Plus size={20} className="mr-2" />
                        Thêm sân đầu tiên
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {courts.map((court) => (
                        <Card key={court.id} className="p-5 hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-start gap-4">
                                {/* Thumbnail */}
                                <div className="w-24 h-24 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0">
                                    {court.thumbnailUrl ? (
                                        <img
                                            src={court.thumbnailUrl}
                                            alt={court.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Building2 size={32} className="text-slate-600" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-1">{court.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                                                <MapPin size={16} />
                                                <span className="truncate">{court.address}</span>
                                            </div>
                                        </div>
                                        {getStatusBadge(court.status, court.isActive)}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Giá/giờ</p>
                                            <p className="text-sm font-semibold text-white">
                                                {court.pricePerHour.toLocaleString()}đ
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Giờ hoạt động</p>
                                            <p className="text-sm font-semibold text-white flex items-center gap-1">
                                                <Clock size={14} />
                                                {court.openTime} - {court.closeTime}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Đánh giá</p>
                                            <p className="text-sm font-semibold text-white">
                                                ⭐ {court.rating.toFixed(1)} ({court.totalReviews})
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Tự động duyệt</p>
                                            <p className="text-sm font-semibold text-white">
                                                {court.autoApproveBookings ? (
                                                    <span className="text-green-400">Bật</span>
                                                ) : (
                                                    <span className="text-yellow-400">Tắt</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Facilities */}
                                    {court.facilities && court.facilities.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {court.facilities.map((facility, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 text-xs rounded bg-slate-700 text-slate-300"
                                                >
                                                    {facility}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(court)}
                                            className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm font-semibold flex items-center gap-1"
                                        >
                                            <Edit2 size={14} />
                                            Chỉnh sửa
                                        </button>
                                        <button
                                            onClick={() => handleDelete(court.id)}
                                            disabled={deletingId === court.id}
                                            className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-semibold flex items-center gap-1 disabled:opacity-50"
                                        >
                                            <Trash2 size={14} />
                                            {deletingId === court.id ? 'Đang xóa...' : 'Xóa'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Card>
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
