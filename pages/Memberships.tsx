import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Zap, Calendar, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageTransition } from '../components/Layout/PageTransition';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useToast } from '../components/ui/Toast';
import { ApiService } from '../services/api';
import { Package } from '../types';
import { useAuthStore } from '../stores/authStore';

export const Memberships: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { showToast } = useToast();
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            // Mocking membership packages for now as they might not be in DB yet
            // In real app, fetch from API: ApiService.getMembershipPackages()
            const mockPackages: Package[] = [
                {
                    id: 'monthly-basic',
                    name: 'Thẻ Tháng Cơ Bản',
                    price: 1500000,
                    durationMinutes: 0,
                    description: 'Chơi thả ga 30 ngày',
                    features: ['Check-in không giới hạn', 'Giảm 10% đồ uống', 'Ưu tiên đặt sân'],
                    type: 'monthly',
                    validity_days: 30
                },
                {
                    id: 'session-pack-10',
                    name: 'Gói 10 Buổi',
                    price: 800000,
                    durationMinutes: 0,
                    description: 'Tiết kiệm 20% so với vé lẻ',
                    features: ['10 lượt chơi bất kỳ', 'Hạn sử dụng 3 tháng', 'Tặng 1 nước/buổi'],
                    type: 'session_pack',
                    session_count: 10,
                    validity_days: 90,
                    isBestValue: true
                },
                {
                    id: 'fixed-slot-morning',
                    name: 'Cố Định Sáng',
                    price: 1200000,
                    durationMinutes: 0,
                    description: 'Dành cho người chơi buổi sáng',
                    features: ['Chơi khung 6h-10h sáng', 'Cố định sân quen thuộc', 'Miễn phí gửi xe'],
                    type: 'fixed_slot',
                    validity_days: 30
                }
            ];
            setPackages(mockPackages);
        } catch (error) {
            console.error('Error fetching packages:', error);
            showToast('Không thể tải danh sách gói', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = (pkg: Package) => {
        // In real app, navigate to payment gateway or confirm purchase
        const confirm = window.confirm(`Xác nhận mua gói ${pkg.name} với giá ${pkg.price.toLocaleString()}đ?`);
        if (confirm) {
            showToast('Tính năng thanh toán đang phát triển!', 'info');
        }
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-slate-900 pb-24">
                {/* Header */}
                <div className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 pt-safe flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white">Gói Hội Viên</h1>
                        <p className="text-xs text-slate-400">Nâng cấp trải nghiệm Pickleball</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-6">
                    {loading ? (
                        <LoadingSpinner />
                    ) : (
                        packages.map((pkg) => (
                            <Card
                                key={pkg.id}
                                className={`p-6 relative overflow-hidden border-2 transition-all ${pkg.isBestValue ? 'border-lime-400 bg-slate-800/80' : 'border-slate-700 bg-slate-800/50'
                                    }`}
                            >
                                {pkg.isBestValue && (
                                    <div className="absolute top-0 right-0 bg-lime-400 text-slate-900 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                                        Phổ biến nhất
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-black text-white mb-1">{pkg.name}</h3>
                                        <p className="text-sm text-slate-400">{pkg.description}</p>
                                    </div>
                                    <div className={`p-3 rounded-xl ${pkg.type === 'monthly' ? 'bg-purple-500/20 text-purple-400' :
                                            pkg.type === 'session_pack' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-orange-500/20 text-orange-400'
                                        }`}>
                                        {pkg.type === 'monthly' ? <Star size={24} /> :
                                            pkg.type === 'session_pack' ? <Zap size={24} /> :
                                                <Calendar size={24} />}
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <span className="text-3xl font-black text-white">{pkg.price.toLocaleString()}đ</span>
                                    <span className="text-slate-500 text-sm">/{pkg.type === 'monthly' ? 'tháng' : 'gói'}</span>
                                </div>

                                <div className="space-y-3 mb-6">
                                    {pkg.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-3 text-sm text-slate-300">
                                            <div className="w-5 h-5 rounded-full bg-lime-400/10 flex items-center justify-center flex-shrink-0">
                                                <Check size={12} className="text-lime-400" strokeWidth={3} />
                                            </div>
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    onClick={() => handlePurchase(pkg)}
                                    variant={pkg.isBestValue ? 'primary' : 'outline'}
                                    size="lg"
                                    className="w-full"
                                >
                                    Đăng ký ngay
                                </Button>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </PageTransition>
    );
};
