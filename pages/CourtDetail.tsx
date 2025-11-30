import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, MapPin, Star, Clock, Wifi, Camera,
    Users, Heart, Share2, Phone, Navigation, ChevronRight,
    Check, Zap, Trophy, Shield, Sparkles
} from 'lucide-react';
import { PageTransition } from '../components/Layout/PageTransition';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ApiService } from '../services/api';
import { Court } from '../types';
import { useRealtimeAvailability } from '../hooks/useRealtimeBookings';

export const CourtDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [court, setCourt] = useState<Court | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);

    const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

    // Enable real-time availability updates for this court
    useRealtimeAvailability(id || '');


    useEffect(() => {
        const fetchCourt = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const res = await ApiService.getCourtById(id);
                if (res.success && res.data) {
                    // Merge with some default rich data if missing from DB (for MVP)
                    const richData = {
                        ...res.data,
                        images: res.data.images || [
                            res.data.thumbnailUrl,
                            'https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?w=800',
                            'https://images.unsplash.com/photo-1594911772125-07fc7a2d8d9f?w=800'
                        ],
                        facilities: res.data.facilities || ['Wifi miễn phí', 'Camera AI', 'Phòng thay đồ', 'Căn-tin', 'Sân đêm'],
                        description: res.data.description || 'Sân pickleball cao cấp với hệ thống camera AI tự động ghi hình và tạo highlight. Nằm ngay trung tâm thành phố, tiện lợi di chuyển.',
                        openTime: res.data.openTime || '06:00',
                        closeTime: res.data.closeTime || '22:00',
                        totalReviews: res.data.totalReviews || 156
                    };
                    setCourt(richData);
                } else {
                    // Handle error or not found
                    console.error("Court not found");
                }
            } catch (error) {
                console.error("Error fetching court", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourt();
    }, [id]);

    if (loading || !court) {
        return <LoadingSpinner fullScreen />;
    }

    const images = court.images || [court.thumbnailUrl];

    return (
        <PageTransition>
            <div className="min-h-screen bg-slate-900 pb-24">
                {/* Header - Fixed */}
                <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
                    <div className="flex items-center justify-between p-4 pt-safe">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsFavorite(!isFavorite)}
                                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                            >
                                <Heart
                                    size={20}
                                    className={isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-400'}
                                />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
                                <Share2 size={18} className="text-slate-400" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Image Gallery */}
                <div className="relative h-[400px] bg-slate-800 mt-16">
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={currentImageIndex}
                            src={images[currentImageIndex]}
                            alt={court.name}
                            className="w-full h-full object-cover"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        />
                    </AnimatePresence>

                    {/* Image indicators */}
                    {images.length > 1 && (
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                            {images.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className={`h-2 rounded-full transition-all ${index === currentImageIndex
                                        ? 'w-8 bg-lime-400'
                                        : 'w-2 bg-white/40'
                                        }`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Status badge */}
                    <div className="absolute top-4 left-4">
                        <div className="px-3 py-1.5 rounded-full bg-green-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            Còn trống
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 -mt-6">
                    {/* Main Info Card */}
                    <Card className="p-6 mb-6 glass">
                        <h1 className="text-2xl font-black text-white mb-3">
                            {court.name}
                        </h1>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-1.5">
                                <Star size={18} className="fill-yellow-400 text-yellow-400" />
                                <span className="font-bold text-white">{court.rating}</span>
                                <span className="text-slate-400 text-sm">({court.totalReviews || 0} đánh giá)</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                                <MapPin size={16} />
                                <span>{court.distanceKm} km</span>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 text-slate-300 mb-4">
                            <Navigation size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm">{court.address}</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                icon={<Phone size={16} />}
                                className="flex-1"
                            >
                                Gọi ngay
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                icon={<Navigation size={16} />}
                                className="flex-1"
                            >
                                Chỉ đường
                            </Button>
                        </div>
                    </Card>

                    {/* Description */}
                    <Card className="p-5 mb-6">
                        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                            <Sparkles size={18} className="text-lime-400" />
                            Giới thiệu
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            {court.description}
                        </p>
                    </Card>

                    {/* Facilities */}
                    <Card className="p-5 mb-6">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Shield size={18} className="text-blue-400" />
                            Tiện ích
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {court.facilities?.map((facility, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 p-3 rounded-lg"
                                >
                                    <Check size={16} className="text-lime-400 flex-shrink-0" />
                                    <span>{facility}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Packages */}
                    <Card className="p-5 mb-6">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Trophy size={18} className="text-yellow-400" />
                            Gói dịch vụ
                        </h3>
                        <div className="space-y-3">
                            <PackageCard
                                title="Rally Mode"
                                price="150k/giờ"
                                priceValue={150000}
                                features={['Tự động lưu highlight', '30 giây/clip']}
                                popular={false}
                                isSelected={selectedPackageId === 'pkg_basic'}
                                hasAnySelected={selectedPackageId !== null}
                                onSelect={() => setSelectedPackageId('pkg_basic')}
                            />
                            <PackageCard
                                title="Full Match"
                                price="300k/trận"
                                priceValue={300000}
                                features={['Quay toàn bộ trận', 'AI tạo highlight', 'Tải về full HD']}
                                popular={true}
                                isSelected={selectedPackageId === 'pkg_premium'}
                                hasAnySelected={selectedPackageId !== null}
                                onSelect={() => setSelectedPackageId('pkg_premium')}
                            />
                        </div>
                    </Card>

                    {/* Operating Hours */}
                    <Card className="p-5 mb-6">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Clock size={18} className="text-lime-400" />
                            Giờ hoạt động
                        </h3>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Thứ 2 - Chủ nhật</span>
                            <span className="text-white font-bold">
                                {court.openTime} - {court.closeTime}
                            </span>
                        </div>
                    </Card>
                </div>

                {/* Bottom CTA */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent pb-safe border-t border-slate-800">
                    <div className="flex items-center gap-3">
                        <div>
                            <div className="text-xs text-slate-400">{selectedPackageId ? 'Tổng cộng' : 'Từ'}</div>
                            <div className="text-xl font-black text-lime-400">
                                {(() => {
                                    let totalPrice = court.pricePerHour || 0;
                                    if (selectedPackageId === 'pkg_basic') {
                                        totalPrice += 150000;
                                    } else if (selectedPackageId === 'pkg_premium') {
                                        totalPrice += 300000;
                                    }
                                    return totalPrice.toLocaleString();
                                })()}đ
                            </div>
                        </div>
                        <Button
                            className="flex-1"
                            size="xl"
                            icon={<Zap size={20} />}
                            onClick={() => navigate(`/booking/${court.id}`, { state: { selectedPackageId } })}
                        >
                            Đặt sân ngay
                        </Button>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

// Package Card Component
interface PackageCardProps {
    title: string;
    price: string;
    priceValue: number;
    features: string[];
    popular?: boolean;
    isSelected?: boolean;
    hasAnySelected?: boolean;
    onSelect: () => void;
}

const PackageCard: React.FC<PackageCardProps> = ({
    title,
    price,
    priceValue,
    features,
    popular = false,
    isSelected = false,
    hasAnySelected = false,
    onSelect
}) => (
    <div
        onClick={onSelect}
        className={`relative p-4 rounded-xl cursor-pointer transition-all ${isSelected
            ? 'bg-lime-400/10 border-2 border-lime-400'
            : hasAnySelected
                ? 'bg-slate-800/50 border-2 border-slate-700 opacity-60 hover:opacity-100' // Dim if another is selected
                : popular
                    ? 'bg-gradient-to-r from-lime-400/10 to-green-400/10 border-2 border-lime-400/50'
                    : 'bg-slate-800/50 border-2 border-slate-700 hover:border-slate-600'
            }`}
    >
        {popular && !hasAnySelected && (
            <div className="absolute -top-2 -right-2 bg-lime-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                PHỔ BIẾN
            </div>
        )}
        {isSelected && (
            <div className="absolute -top-2 -right-2 bg-lime-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check size={10} strokeWidth={4} />
                ĐÃ CHỌN
            </div>
        )}
        <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-white">{title}</h4>
            <div className="text-lg font-black text-lime-400">{price}</div>
        </div>
        <div className="space-y-2">
            {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-slate-300">
                    <Check size={14} className="text-lime-400 flex-shrink-0" />
                    <span>{feature}</span>
                </div>
            ))}
        </div>
        {!isSelected && <ChevronRight size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" />}
    </div>
);
