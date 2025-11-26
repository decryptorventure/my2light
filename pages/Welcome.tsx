import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Play, Trophy, Users, ArrowRight,
    Sparkles, Target, TrendingUp
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { PageTransition } from '../components/Layout/PageTransition';

export const Welcome: React.FC = () => {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            icon: Zap,
            title: 'Ghi Lại Mọi Khoảnh Khắc',
            description: 'AI tự động tạo highlight từ những pha bóng đẹp nhất của bạn',
            color: 'from-yellow-400 to-orange-500',
            bgGlow: 'bg-yellow-400/20'
        },
        {
            icon: Trophy,
            title: 'Theo Dõi Tiến Bộ',
            description: 'Thống kê chi tiết về kỹ năng và thành tích của bạn',
            color: 'from-blue-400 to-cyan-500',
            bgGlow: 'bg-blue-400/20'
        },
        {
            icon: Users,
            title: 'Kết Nối Cộng Đồng',
            description: 'Chia sẻ highlight và kết nối với người chơi khác',
            color: 'from-purple-400 to-pink-500',
            bgGlow: 'bg-purple-400/20'
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    const currentSlideData = slides[currentSlide];
    const Icon = currentSlideData.icon;

    return (
        <PageTransition>
            <div className="min-h-screen bg-slate-900 flex flex-col relative overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1 }}
                            className={`absolute top-[-20%] right-[-20%] w-[500px] h-[500px] ${currentSlideData.bgGlow} rounded-full blur-[150px]`}
                        />
                    </AnimatePresence>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-lime-400/10 rounded-full blur-[120px]" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex-1 flex flex-col justify-between p-8 pt-safe pb-safe">
                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-center pt-12"
                    >
                        <motion.div
                            animate={{
                                scale: [1, 1.05, 1],
                                rotate: [0, 5, -5, 0]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="inline-block"
                        >
                            <h1 className="text-6xl font-black text-white mb-2">
                                my<span className="text-lime-400">2</span>light
                            </h1>
                        </motion.div>
                        <p className="text-slate-400 text-sm font-medium">
                            Nền tảng ghi hình pickleball thông minh
                        </p>
                    </motion.div>

                    {/* Slides */}
                    <div className="flex-1 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentSlide}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                transition={{ duration: 0.5 }}
                                className="text-center px-6 max-w-md"
                            >
                                {/* Icon */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 200,
                                        delay: 0.2
                                    }}
                                    className="mb-8"
                                >
                                    <div className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-br ${currentSlideData.color} p-1 shadow-[0_0_60px_rgba(163,230,53,0.3)]`}>
                                        <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                                            <Icon size={64} className="text-white" />
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Text */}
                                <h2 className="text-3xl font-black text-white mb-4">
                                    {currentSlideData.title}
                                </h2>
                                <p className="text-slate-300 text-lg leading-relaxed">
                                    {currentSlideData.description}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Indicators */}
                    <div className="flex justify-center gap-2 mb-8">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`h-2 rounded-full transition-all ${index === currentSlide
                                        ? 'w-8 bg-lime-400'
                                        : 'w-2 bg-slate-700'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="space-y-3">
                        <Button
                            onClick={() => navigate('/login')}
                            size="xl"
                            className="w-full"
                            icon={<ArrowRight size={24} />}
                        >
                            Bắt đầu ngay
                        </Button>

                        <button
                            onClick={() => navigate('/login')}
                            className="w-full text-slate-400 text-sm font-medium py-3 hover:text-white transition-colors"
                        >
                            Đã có tài khoản? <span className="text-lime-400 font-bold">Đăng nhập</span>
                        </button>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-800">
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-2 bg-lime-400/10 rounded-xl flex items-center justify-center">
                                <Target size={24} className="text-lime-400" />
                            </div>
                            <p className="text-xs text-slate-400 font-medium">AI Thông Minh</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-2 bg-blue-400/10 rounded-xl flex items-center justify-center">
                                <TrendingUp size={24} className="text-blue-400" />
                            </div>
                            <p className="text-xs text-slate-400 font-medium">Theo Dõi Stats</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-2 bg-purple-400/10 rounded-xl flex items-center justify-center">
                                <Sparkles size={24} className="text-purple-400" />
                            </div>
                            <p className="text-xs text-slate-400 font-medium">HD Quality</p>
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};
