import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AdminService } from '../../services/admin';
import { CourtDetails, CourtFormData } from '../../types/admin';
import { useToast } from '../ui/Toast';
import { X } from 'lucide-react';

interface CourtFormModalProps {
    court: CourtDetails | null;
    onClose: () => void;
    onSuccess: () => void;
}

const FACILITIES_OPTIONS = [
    'Bãi đậu xe',
    'Phòng thay đồ',
    'Nhà vệ sinh',
    'Quầy cafe',
    'Wifi miễn phí',
    'Đèn chiếu sáng',
    'Điều hòa',
    'Tủ khóa',
    'Camera an ninh'
];

export const CourtFormModal: React.FC<CourtFormModalProps> = ({ court, onClose, onSuccess }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [newImageUrl, setNewImageUrl] = useState('');

    const [formData, setFormData] = useState<CourtFormData>({
        name: '',
        address: '',
        description: '',
        pricePerHour: 0,
        openTime: '06:00',
        closeTime: '22:00',
        facilities: [],
        images: [],
        isActive: true,
        autoApproveBookings: true
    });

    useEffect(() => {
        if (court) {
            setFormData({
                name: court.name,
                address: court.address,
                description: court.description || '',
                pricePerHour: court.pricePerHour,
                openTime: court.openTime,
                closeTime: court.closeTime,
                facilities: court.facilities || [],
                images: court.images || [],
                isActive: court.isActive,
                autoApproveBookings: court.autoApproveBookings
            });
            setImageUrls(court.images || []);
        }
    }, [court]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.address || formData.pricePerHour <= 0) {
            showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
            return;
        }

        setLoading(true);

        const dataToSubmit = {
            ...formData,
            images: imageUrls
        };

        const res = court
            ? await AdminService.updateCourt(court.id, dataToSubmit)
            : await AdminService.createCourt(dataToSubmit);

        setLoading(false);

        if (res.success) {
            showToast(
                court ? 'Cập nhật sân thành công!' : 'Thêm sân mới thành công!',
                'success'
            );
            onSuccess();
        } else {
            showToast(res.error || 'Có lỗi xảy ra', 'error');
        }
    };

    const handleFacilityToggle = (facility: string) => {
        setFormData(prev => ({
            ...prev,
            facilities: prev.facilities.includes(facility)
                ? prev.facilities.filter(f => f !== facility)
                : [...prev.facilities, facility]
        }));
    };

    const handleAddImage = () => {
        if (newImageUrl && !imageUrls.includes(newImageUrl)) {
            setImageUrls([...imageUrls, newImageUrl]);
            setNewImageUrl('');
        }
    };

    const handleRemoveImage = (index: number) => {
        setImageUrls(imageUrls.filter((_, i) => i !== index));
    };

    return (
        <Modal isOpen onClose={onClose}>
            <div className="bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">
                        {court ? 'Chỉnh sửa sân' : 'Thêm sân mới'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Thông tin cơ bản</h3>

                        <Input
                            label="Tên sân *"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="VD: Sân Pickleball ABC"
                            required
                        />

                        <Input
                            label="Địa chỉ *"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="123 Đường ABC, Quận 1, TP.HCM"
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Mô tả
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Mô tả về sân..."
                                rows={3}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-lime-400"
                            />
                        </div>
                    </div>

                    {/* Pricing & Hours */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Giá & Giờ hoạt động</h3>

                        <Input
                            label="Giá/giờ (VNĐ) *"
                            type="number"
                            value={formData.pricePerHour}
                            onChange={(e) => setFormData({ ...formData, pricePerHour: Number(e.target.value) })}
                            placeholder="200000"
                            required
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Giờ mở cửa"
                                type="time"
                                value={formData.openTime}
                                onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                            />
                            <Input
                                label="Giờ đóng cửa"
                                type="time"
                                value={formData.closeTime}
                                onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Facilities */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Tiện ích</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {FACILITIES_OPTIONS.map((facility) => (
                                <button
                                    key={facility}
                                    type="button"
                                    onClick={() => handleFacilityToggle(facility)}
                                    className={`px-4 py-2 rounded-lg border transition-colors text-sm font-medium ${formData.facilities.includes(facility)
                                        ? 'bg-lime-400/20 border-lime-400 text-lime-400'
                                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                                        }`}
                                >
                                    {facility}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Images */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Hình ảnh</h3>

                        <div className="flex gap-2">
                            <Input
                                value={newImageUrl}
                                onChange={(e) => setNewImageUrl(e.target.value)}
                                placeholder="Nhập URL hình ảnh"
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                onClick={handleAddImage}
                                variant="secondary"
                                disabled={!newImageUrl}
                            >
                                Thêm
                            </Button>
                        </div>

                        {imageUrls.length > 0 && (
                            <div className="grid grid-cols-3 gap-3">
                                {imageUrls.map((url, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={url}
                                            alt={`Image ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(index)}
                                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Settings */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Cài đặt</h3>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-lime-400 focus:ring-lime-400"
                            />
                            <span className="text-white">Sân đang hoạt động</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.autoApproveBookings}
                                onChange={(e) => setFormData({ ...formData, autoApproveBookings: e.target.checked })}
                                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-lime-400 focus:ring-lime-400"
                            />
                            <span className="text-white">Tự động duyệt đơn đặt sân</span>
                        </label>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-slate-700 flex gap-3 justify-end">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        isLoading={loading}
                        disabled={loading}
                    >
                        {court ? 'Cập nhật' : 'Thêm sân'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
