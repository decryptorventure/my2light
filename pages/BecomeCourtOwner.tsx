import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/Layout/PageTransition';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { AdminService } from '../services/admin';
import { useToast } from '../components/ui/Toast';
import { ArrowLeft, Building2, Phone, Mail, MapPin, FileText } from 'lucide-react';

export const BecomeCourtOwner: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        businessName: '',
        phone: '',
        email: '',
        address: '',
        taxId: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.businessName || !formData.phone || !formData.email) {
            showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
            return;
        }

        setLoading(true);
        const res = await AdminService.createCourtOwnerProfile({
            businessName: formData.businessName,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            taxId: formData.taxId
        });

        setLoading(false);

        if (res.success) {
            showToast('Đăng ký thành công! Chào mừng bạn trở thành chủ sân 🎉', 'success');
            setTimeout(() => navigate('/admin/dashboard'), 1000);
        } else {
            showToast(res.error || 'Đăng ký thất bại', 'error');
        }
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-slate-900 p-6 pt-8 pb-24">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">Đăng ký làm chủ sân</h1>
                        <p className="text-sm text-slate-400">Quản lý sân và kết nối với người chơi</p>
                    </div>
                </div>

                {/* Benefits */}
                <Card className="p-5 mb-6 bg-gradient-to-r from-lime-400/10 to-green-400/10 border-lime-400/30">
                    <h3 className="font-bold text-white mb-3">Lợi ích khi trở thành chủ sân</h3>
                    <div className="space-y-2 text-sm text-slate-300">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-lime-400"></div>
                            <span>Quản lý booking tự động</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-lime-400"></div>
                            <span>Kết nối với hàng nghìn người chơi</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-lime-400"></div>
                            <span>Thống kê doanh thu chi tiết</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-lime-400"></div>
                            <span>Tích hợp AI camera tự động</span>
                        </div>
                    </div>
                </Card>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Card className="p-5">
                        <h3 className="font-bold text-white mb-4">Thông tin doanh nghiệp</h3>

                        <div className="space-y-4">
                            <Input
                                label="Tên doanh nghiệp *"
                                placeholder="VD: Sân Pickleball ABC"
                                value={formData.businessName}
                                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                leftIcon={<Building2 size={20} />}
                                required
                            />

                            <Input
                                label="Số điện thoại *"
                                type="tel"
                                placeholder="0901234567"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                leftIcon={<Phone size={20} />}
                                required
                            />

                            <Input
                                label="Email *"
                                type="email"
                                placeholder="contact@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                leftIcon={<Mail size={20} />}
                                required
                            />

                            <Input
                                label="Địa chỉ"
                                placeholder="123 Đường ABC, Quận 1, TP.HCM"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                leftIcon={<MapPin size={20} />}
                            />

                            <Input
                                label="Mã số thuế"
                                placeholder="0123456789"
                                value={formData.taxId}
                                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                                leftIcon={<FileText size={20} />}
                            />
                        </div>
                    </Card>

                    <Button
                        type="submit"
                        className="w-full"
                        size="xl"
                        isLoading={loading}
                        disabled={loading}
                    >
                        Hoàn tất đăng ký
                    </Button>

                    <p className="text-xs text-slate-500 text-center">
                        Bằng việc đăng ký, bạn đồng ý với điều khoản dịch vụ của my2light
                    </p>
                </form>
            </div>
        </PageTransition>
    );
};
