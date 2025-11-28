import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Calendar, Clock, Check, ChevronRight, CreditCard, Video, VideoOff } from 'lucide-react';
import { PageTransition } from '../components/Layout/PageTransition';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useToast } from '../components/ui/Toast';
import { ApiService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Court, Package } from '../types';

export const Booking: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuthStore();

    const [step, setStep] = useState<'datetime' | 'package' | 'payment'>('datetime');
    const [court, setCourt] = useState<Court | null>(null);
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);

    // Selection States
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null); // null means no recording
    const [isProcessing, setIsProcessing] = useState(false);

    const location = useLocation();

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const [courtRes, packagesRes] = await Promise.all([
                    ApiService.getCourtById(id),
                    ApiService.getPackages()
                ]);

                if (courtRes.success && courtRes.data) setCourt(courtRes.data);
                if (packagesRes.success) {
                    setPackages(packagesRes.data);

                    // Check for pre-selected package from navigation state
                    const state = location.state as { selectedPackageId?: string };
                    if (state?.selectedPackageId) {
                        setSelectedPackage(state.selectedPackageId);
                        // Optional: Auto-advance to package step if we want to confirm, 
                        // but user might want to pick date first. 
                        // Let's just pre-select it so step 2 is ready.
                    }
                }
            } catch (error) {
                console.error("Error fetching booking data", error);
                showToast("Không thể tải thông tin sân", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, location.state]);

    // Generate next 7 days
    const generateDates = () => {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    // Generate time slots (06:00 - 22:00)
    const generateTimeSlots = () => {
        const slots = [];
        const now = new Date();
        const isToday = selectedDate.toDateString() === now.toDateString();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        for (let i = 6; i <= 22; i++) {
            // Check if slot is in the past
            if (isToday) {
                if (i < currentHour) continue;
                if (i === currentHour && currentMinute > 0) {
                    // Skip XX:00 if we are past it
                    // But keep XX:30 if we are before 30
                }
            }

            // XX:00
            if (!isToday || i > currentHour || (i === currentHour && currentMinute < 0)) {
                slots.push(`${i.toString().padStart(2, '0')}:00`);
            }

            // XX:30
            if (!isToday || i > currentHour || (i === currentHour && currentMinute < 30)) {
                slots.push(`${i.toString().padStart(2, '0')}:30`);
            }
        }
        return slots.sort();
    };

    const handlePayment = async () => {
        if (!selectedTime || !court) return;

        setIsProcessing(true);
        try {
            // Parse start time
            const [hours, minutes] = selectedTime.split(':').map(Number);
            const startTime = new Date(selectedDate);
            startTime.setHours(hours, minutes, 0, 0);

            // Default duration 1 hour for now
            const durationHours = 1;

            const res = await ApiService.createBooking(
                court.id,
                startTime.getTime(),
                durationHours,
                selectedPackage || undefined
            );

            if (res.success) {
                showToast('Đặt sân thành công! 🎉', 'success');

                // Navigate to success page with details
                navigate('/booking-success', {
                    state: {
                        courtName: court.name,
                        date: selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' }),
                        time: selectedTime,
                        totalPrice: totalPrice,
                        packageName: selectedPkg?.name
                    }
                });
            } else {
                showToast(res.error || 'Đặt sân thất bại', 'error');
            }
        } catch (error) {
            console.error('Payment error:', error);
            showToast('Có lỗi xảy ra', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading || !court) return <LoadingSpinner fullScreen />;

    const dates = generateDates();
    const timeSlots = generateTimeSlots();
    const selectedPkg = packages.find(p => p.id === selectedPackage);

    // Pricing Calculation
    const durationHours = 1; // Fixed for MVP
    const courtPrice = (court.pricePerHour || 0) * durationHours;
    const packagePrice = selectedPkg ? selectedPkg.price : 0;
    const totalPrice = courtPrice + packagePrice;

    return (
        <PageTransition>
            <div className="min-h-screen bg-slate-900 pb-safe">
                {/* Header */}
                <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
                    <div className="flex items-center p-4 pt-safe gap-4">
                        <button
                            onClick={() => step === 'datetime' ? navigate(-1) : setStep(prev => prev === 'payment' ? 'package' : 'datetime')}
                            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">Đặt sân</h1>
                            <p className="text-xs text-slate-400">{court.name}</p>
                        </div>
                    </div>
                </div>

                <div className="pt-24 px-6 pb-40">
                    {/* Progress Steps */}
                    <div className="flex items-center justify-between mb-8 px-4">
                        {['datetime', 'package', 'payment'].map((s, i) => (
                            <div key={s} className="flex flex-col items-center gap-2 relative z-10">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === s || (step === 'package' && i === 0) || (step === 'payment' && i <= 1)
                                    ? 'bg-lime-400 text-slate-900'
                                    : 'bg-slate-800 text-slate-500'
                                    }`}>
                                    {i + 1}
                                </div>
                                <span className="text-[10px] uppercase font-bold text-slate-500">
                                    {s === 'datetime' ? 'Thời gian' : s === 'package' ? 'Gói quay' : 'Thanh toán'}
                                </span>
                            </div>
                        ))}
                        {/* Progress Line */}
                        <div className="absolute left-10 right-10 top-[110px] h-0.5 bg-slate-800 -z-0">
                            <div
                                className="h-full bg-lime-400 transition-all duration-300"
                                style={{ width: step === 'datetime' ? '0%' : step === 'package' ? '50%' : '100%' }}
                            />
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 'datetime' && (
                            <motion.div
                                key="datetime"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                {/* Date Selection */}
                                <div>
                                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                        <Calendar size={20} className="text-lime-400" />
                                        Chọn ngày
                                    </h3>
                                    <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                                        {dates.map((date, i) => {
                                            const isSelected = date.toDateString() === selectedDate.toDateString();
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => setSelectedDate(date)}
                                                    className={`flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition-all ${isSelected
                                                        ? 'bg-lime-400 border-lime-400 text-slate-900'
                                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                                        }`}
                                                >
                                                    <span className="text-xs font-medium uppercase">
                                                        {date.toLocaleDateString('vi-VN', { weekday: 'short' })}
                                                    </span>
                                                    <span className="text-xl font-black">
                                                        {date.getDate()}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Time Selection */}
                                <div>
                                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                        <Clock size={20} className="text-blue-400" />
                                        Chọn giờ
                                    </h3>
                                    <div className="grid grid-cols-4 gap-3">
                                        {timeSlots.map((slot, i) => {
                                            // Mock disabled slots (randomly)
                                            const isDisabled = (i % 5 === 0 || i % 7 === 0) && i !== 0;
                                            const isSelected = selectedTime === slot;

                                            return (
                                                <button
                                                    key={i}
                                                    disabled={isDisabled}
                                                    onClick={() => setSelectedTime(slot)}
                                                    className={`py-2 rounded-lg text-sm font-bold border transition-all ${isSelected
                                                        ? 'bg-lime-400 border-lime-400 text-slate-900 shadow-[0_0_10px_rgba(163,230,53,0.3)]'
                                                        : isDisabled
                                                            ? 'bg-slate-800/50 border-transparent text-slate-600 cursor-not-allowed decoration-slate-600 line-through'
                                                            : 'bg-slate-800 border-slate-700 text-white hover:border-slate-500'
                                                        }`}
                                                >
                                                    {slot}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 'package' && (
                            <motion.div
                                key="package"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <h3 className="font-bold text-white mb-2">Chọn gói quay (Tùy chọn)</h3>

                                {/* No Recording Option */}
                                <Card
                                    onClick={() => setSelectedPackage(null)}
                                    className={`p-5 relative cursor-pointer border-2 transition-all ${selectedPackage === null
                                        ? 'border-lime-400 bg-slate-800 ring-2 ring-lime-400/20'
                                        : 'border-transparent bg-slate-800/50 hover:bg-slate-800'
                                        }`}
                                >
                                    {selectedPackage === null && (
                                        <div className="absolute top-4 right-4 bg-lime-400 text-slate-900 rounded-full p-1">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center mb-1 pr-8">
                                        <div className="flex items-center gap-2">
                                            <VideoOff size={20} className="text-slate-400" />
                                            <h3 className="font-bold text-lg">Không quay</h3>
                                        </div>
                                        <div className="text-xl font-bold text-slate-400">0đ</div>
                                    </div>
                                    <p className="text-slate-400 text-sm">Chỉ đặt sân, không sử dụng dịch vụ quay highlight.</p>
                                </Card>

                                {/* Package Options */}
                                {packages.map((pkg) => (
                                    <Card
                                        key={pkg.id}
                                        onClick={() => setSelectedPackage(pkg.id)}
                                        className={`p-5 relative cursor-pointer border-2 transition-all ${selectedPackage === pkg.id
                                            ? 'border-lime-400 bg-slate-800 ring-2 ring-lime-400/20'
                                            : 'border-transparent bg-slate-800/50 hover:bg-slate-800'
                                            }`}
                                    >
                                        {selectedPackage === pkg.id && (
                                            <div className="absolute top-4 right-4 bg-lime-400 text-slate-900 rounded-full p-1">
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center mb-1 pr-8">
                                            <div className="flex items-center gap-2">
                                                <Video size={20} className="text-lime-400" />
                                                <h3 className="font-bold text-lg">{pkg.name}</h3>
                                            </div>
                                            <div className="text-xl font-bold text-lime-400">{pkg.price.toLocaleString()}đ</div>
                                        </div>
                                        <p className="text-slate-400 text-sm mb-2">{pkg.durationMinutes} phút thi đấu</p>
                                        <p className="text-slate-500 text-xs italic">{pkg.description}</p>
                                    </Card>
                                ))}
                            </motion.div>
                        )}

                        {step === 'payment' && (
                            <motion.div
                                key="payment"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <Card className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
                                    <h3 className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-6 text-center">Xác nhận đặt sân</h3>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                                            <span className="text-slate-400">Sân</span>
                                            <span className="font-bold text-right w-1/2 truncate">{court.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                                            <span className="text-slate-400">Thời gian</span>
                                            <div className="text-right">
                                                <div className="font-bold text-lime-400">{selectedTime}</div>
                                                <div className="text-xs text-slate-500">
                                                    {selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pricing Breakdown */}
                                        <div className="flex justify-between items-center pb-2">
                                            <span className="text-slate-400">Giá sân ({durationHours}h)</span>
                                            <span className="font-medium">{courtPrice.toLocaleString()}đ</span>
                                        </div>

                                        <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                                            <span className="text-slate-400">Gói quay</span>
                                            <span className="font-medium">
                                                {selectedPkg ? `${selectedPkg.name} (+${selectedPkg.price.toLocaleString()}đ)` : 'Không chọn'}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-slate-400">Tổng cộng</span>
                                            <span className="text-3xl font-black text-white">{totalPrice.toLocaleString()}đ</span>
                                        </div>
                                    </div>
                                </Card>

                                <div className={`p-4 rounded-xl flex items-start gap-3 ${(user?.credits || 0) >= totalPrice
                                    ? 'bg-slate-800/50'
                                    : 'bg-red-500/10 border border-red-500/30'
                                    }`}>
                                    <CreditCard className={`${(user?.credits || 0) >= totalPrice ? 'text-lime-400' : 'text-red-400'} mt-1`} size={20} />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <p className="font-bold text-sm text-white">Ví My2Light</p>
                                            <p className={`font-bold text-sm ${(user?.credits || 0) >= totalPrice ? 'text-lime-400' : 'text-red-400'}`}>
                                                Số dư: {(user?.credits || 0).toLocaleString()}đ
                                            </p>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {(user?.credits || 0) >= totalPrice
                                                ? 'Số dư sẽ được trừ trực tiếp vào ví của bạn.'
                                                : 'Số dư không đủ. Vui lòng nạp thêm.'}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Bottom Action Bar */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-slate-800 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.5)]" style={{ zIndex: 100 }}>
                    {step === 'datetime' && (
                        <Button
                            onClick={() => setStep('package')}
                            disabled={!selectedTime}
                            size="xl"
                            className="w-full"
                            icon={<ChevronRight />}
                        >
                            Tiếp tục chọn gói
                        </Button>
                    )}

                    {step === 'package' && (
                        <Button
                            onClick={() => setStep('payment')}
                            // Always enabled because "No Recording" is a valid option (null)
                            size="xl"
                            className="w-full"
                            icon={<ChevronRight />}
                        >
                            Tiếp tục thanh toán
                        </Button>
                    )}

                    {step === 'payment' && (
                        <Button
                            onClick={handlePayment}
                            disabled={isProcessing}
                            size="xl"
                            className="w-full"
                            icon={isProcessing ? <LoadingSpinner size="sm" /> : <Check />}
                        >
                            {isProcessing ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
                        </Button>
                    )}
                </div>
            </div>
        </PageTransition>
    );
};
