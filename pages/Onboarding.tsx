import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ApiService } from '../services/api';
import { celebrate, burst } from '../lib/confetti';
import {
    ArrowRight, Camera, Check, ChevronLeft, Play,
    Trophy, Star, Zap, Target, Award, Heart
} from 'lucide-react';

export const Onboarding: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [avatar, setAvatar] = useState<string>('');
    const [skillLevel, setSkillLevel] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const totalSteps = 5;
    const progress = ((step + 1) / totalSteps) * 100;

    const handleNext = async () => {
        if (step < totalSteps - 1) {
            setStep(step + 1);
            // Celebrate milestones
            if (step === 1 || step === 3) {
                celebrate({ particleCount: 30, spread: 40 });
            }
        } else {
            // Final celebration
            burst();
            setLoading(true);
            await ApiService.updateUserProfile({
                name,
                phone,
                avatar: avatar || 'https://cdn-icons-png.flaticon.com/512/3307/3307873.png',
                has_onboarded: true
            });
            setLoading(false);
            navigate('/home');
        }
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    const handleSkip = async () => {
        await ApiService.updateUserProfile({ has_onboarded: true });
        navigate('/home');
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result as string);
                celebrate({ particleCount: 50 });
            };
            reader.readAsDataURL(file);
        }
    };

    const canProceed = () => {
        switch (step) {
            case 1: return name.trim().length >= 2;
            case 2: return avatar !== '';
            case 3: return skillLevel !== '';
            default: return true;
        }
    };

    // Step configurations
    const steps = [
        {
            // Welcome
            title: "Chào mừng đến với my2light! 🎾",
            subtitle: "Nền tảng ghi lại khoảnh khắc tuyệt vời của bạn",
            content: (
                <div className="text-center space-y-6 py-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                        className="w-32 h-32 mx-auto bg-gradient-to-br from-lime-400 to-lime-600 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(163,230,53,0.4)]"
                    >
                        <Zap size={64} className="text-slate-900fill-slate-900" />
                    </motion.div>

                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex items-start gap-3 text-left bg-slate-800/50 p-4 rounded-xl"
                        >
                            <div className="w-8 h-8 rounded-lg bg-lime-400/20 flex items-center justify-center flex-shrink-0">
                                <Target size={18} className="text-lime-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-1">Ghi lại mọi khoảnh khắc</h4>
                                <p className="text-sm text-slate-400">AI tự động tạo highlight từ những pha bóng đẹp nhất</p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="flex items-start gap-3 text-left bg-slate-800/50 p-4 rounded-xl"
                        >
                            <div className="w-8 h-8 rounded-lg bg-blue-400/20 flex items-center justify-center flex-shrink-0">
                                <Trophy size={18} className="text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-1">Theo dõi tiến bộ</h4>
                                <p className="text-sm text-slate-400">Thống kê chi tiết về trận đấu và kỹ năng của bạn</p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="flex items-start gap-3 text-left bg-slate-800/50 p-4 rounded-xl"
                        >
                            <div className="w-8 h-8 rounded-lg bg-purple-400/20 flex items-center justify-center flex-shrink-0">
                                <Heart size={18} className="text-purple-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-1">Chia sẻ & Kết nối</h4>
                                <p className="text-sm text-slate-400">Chia sẻ highlight với bạn bè và cộng đồng</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )
        },
        {
            // Name input
            title: "Tên của bạn là gì?",
            subtitle: "Chọn tên hiển thị mà bạn muốn",
            content: (
                <div className="space-y-6 py-6">
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ví dụ: Tuấn Pickleball"
                        autoFocus
                        variant="filled"
                        className="text-lg text-center font-bold"
                    />
                    <p className="text-xs text-slate-500 text-center">
                        Bạn có thể thay đổi tên này bất cứ lúc nào
                    </p>
                </div>
            )
        },
        {
            // Avatar upload
            title: "Chọn ảnh đại diện",
            subtitle: "Giúp mọi người dễ nhận ra bạn hơn",
            content: (
                <div className="space-y-6 py-6">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="relative w-40 h-40 mx-auto cursor-pointer group"
                    >
                        {avatar ? (
                            <motion.img
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                src={avatar}
                                alt="Avatar"
                                className="w-full h-full rounded-full object-cover border-4 border-lime-400 shadow-xl"
                            />
                        ) : (
                            <div className="w-full h-full rounded-full border-4 border-dashed border-slate-700 flex items-center justify-center bg-slate-800/50 group-hover:border-lime-400 transition-colors">
                                <Camera size={48} className="text-slate-600 group-hover:text-lime-400 transition-colors" />
                            </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-12 h-12 bg-lime-400 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-lg">
                            <Camera size={20} className="text-slate-900" />
                        </div>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                    />
                    {!avatar && (
                        <p className="text-sm text-slate-400 text-center">
                            Nhấn vào để chọn ảnh
                        </p>
                    )}
                </div>
            )
        },
        {
            // Skill level - Interactive
            title: "Trình độ của bạn?",
            subtitle: "Giúp chúng tôi gợi ý đối thủ phù hợp",
            content: (
                <div className="space-y-3 py-6">
                    {[
                        {
                            id: 'beginner',
                            label: 'Mới chơi 🌱',
                            desc: 'Chưa nắm rõ luật, đang học hỏi',
                            color: 'from-green-500 to-emerald-600',
                            icon: Star
                        },
                        {
                            id: 'intermediate',
                            label: 'Phong trào 🎯',
                            desc: 'Đã chơi > 6 tháng, nắm rõ luật',
                            color: 'from-blue-500 to-cyan-600',
                            icon: Target
                        },
                        {
                            id: 'advanced',
                            label: 'Chuyên nghiệp 🏆',
                            desc: 'Thi đấu thường xuyên, kỹ năng cao',
                            color: 'from-purple-500 to-pink-600',
                            icon: Trophy
                        }
                    ].map((level) => {
                        const Icon = level.icon;
                        const isSelected = skillLevel === level.id;

                        return (
                            <motion.div
                                key={level.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    setSkillLevel(level.id);
                                    celebrate({ particleCount: 20, spread: 30 });
                                }}
                                className={`relative p-5 rounded-2xl cursor-pointer transition-all ${isSelected
                                        ? 'bg-gradient-to-r ' + level.color + ' shadow-xl scale-105'
                                        : 'bg-slate-800 hover:bg-slate-750 border-2 border-slate-700'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isSelected ? 'bg-white/20' : 'bg-slate-700'
                                        }`}>
                                        <Icon size={28} className={isSelected ? 'text-white' : 'text-slate-400'} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`font-bold text-lg mb-1 ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                            {level.label}
                                        </h4>
                                        <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                                            {level.desc}
                                        </p>
                                    </div>
                                    {isSelected && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-8 h-8 bg-white rounded-full flex items-center justify-center"
                                        >
                                            <Check size={20} className="text-slate-900" strokeWidth={3} />
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )
        },
        {
            // Welcome gift
            title: "Sẵn sàng bắt đầu! 🎉",
            subtitle: "Tặng bạn 200k credit để trải nghiệm",
            content: (
                <div className="text-center space-y-6 py-8">
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="w-32 h-32 mx-auto bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-[0_0_80px_rgba(251,191,36,0.6)]"
                    >
                        <Award size={64} className="text-white" />
                    </motion.div>

                    <div className="bg-gradient-to-r from-lime-400/10 to-green-400/10 border-2 border-lime-400/30 rounded-2xl p-6">
                        <div className="text-5xl font-black text-lime-400 mb-2">200,000đ</div>
                        <p className="text-slate-300">Đã được thêm vào ví của bạn</p>
                    </div>

                    <div className="space-y-3 text-left">
                        <div className="flex items-center gap-3 text-sm text-slate-300">
                            <div className="w-6 h-6 rounded-full bg-lime-400/20 flex items-center justify-center flex-shrink-0">
                                <Check size={14} className="text-lime-400" strokeWidth={3} />
                            </div>
                            <span>Tài khoản đã được kích hoạt</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-300">
                            <div className="w-6 h-6 rounded-full bg-lime-400/20 flex items-center justify-center flex-shrink-0">
                                <Check size={14} className="text-lime-400" strokeWidth={3} />
                            </div>
                            <span>Hồ sơ đã được thiết lập</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-300">
                            <div className="w-6 h-6 rounded-full bg-lime-400/20 flex items-center justify-center flex-shrink-0">
                                <Check size={14} className="text-lime-400" strokeWidth={3} />
                            </div>
                            <span>200k credit miễn phí</span>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    const currentStep = steps[step];

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col">
            {/* Progress Bar */}
            <div className="fixed top-0 left-0 right-0 z-50">
                <div className="h-1 bg-slate-800">
                    <motion.div
                        className="h-full bg-gradient-to-r from-lime-400 to-green-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-4 pt-8">
                {step > 0 ? (
                    <button
                        onClick={handleBack}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                ) : (
                    <div className="w-10" />
                )}

                <div className="text-sm text-slate-500 font-medium">
                    {step + 1} / {totalSteps}
                </div>

                {step < totalSteps - 1 && (
                    <button
                        onClick={handleSkip}
                        className="text-sm text-slate-500 hover:text-slate-300 transition-colors px-3 py-1"
                    >
                        Bỏ qua
                    </button>
                )}
                {step === totalSteps - 1 && <div className="w-10" />}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-center px-6 pb-32">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-md mx-auto"
                    >
                        <h2 className="text-3xl font-black text-white mb-2 text-center">
                            {currentStep.title}
                        </h2>
                        <p className="text-slate-400 mb-8 text-center">
                            {currentStep.subtitle}
                        </p>

                        {currentStep.content}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom CTA */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent pb-safe">
                <Button
                    onClick={handleNext}
                    disabled={!canProceed() || loading}
                    isLoading={loading}
                    className="w-full max-w-md mx-auto flex items-center justify-center gap-2"
                    size="xl"
                    haptic={true}
                >
                    <span>{step === totalSteps - 1 ? 'Bắt đầu ngay' : 'Tiếp tục'}</span>
                    {step < totalSteps - 1 && <ArrowRight size={20} />}
                </Button>
            </div>
        </div>
    );
};
