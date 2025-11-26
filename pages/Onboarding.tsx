import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { ApiService } from '../services/api';
import { ArrowRight, Check, User, Trophy, Star } from 'lucide-react';

export const Onboarding: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [skillLevel, setSkillLevel] = useState('beginner');
    const [loading, setLoading] = useState(false);

    const handleNext = async () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            // Finish
            setLoading(true);
            await ApiService.updateUserProfile({
                name,
                phone,
                // We could store skillLevel in metadata or a new column if we had one
            });
            setLoading(false);
            navigate('/home');
        }
    };

    const steps = [
        {
            id: 1,
            title: "Chào mừng bạn!",
            desc: "Hãy cập nhật thông tin để mọi người dễ dàng nhận ra bạn trên sân.",
            icon: User,
            content: (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Tên hiển thị</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ví dụ: Tuấn Pickleball"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-lime-400 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Số điện thoại</label>
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="0912..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-lime-400 focus:outline-none"
                        />
                    </div>
                </div>
            )
        },
        {
            id: 2,
            title: "Trình độ của bạn?",
            desc: "Giúp chúng tôi gợi ý đối thủ và giải đấu phù hợp.",
            icon: Trophy,
            content: (
                <div className="space-y-3">
                    {[
                        { id: 'beginner', label: 'Mới chơi', desc: 'Chưa nắm rõ luật, đang học hỏi' },
                        { id: 'intermediate', label: 'Phong trào', desc: 'Đã chơi > 6 tháng, nắm rõ luật' },
                        { id: 'advanced', label: 'Chuyên nghiệp', desc: 'Thi đấu thường xuyên, kỹ năng cao' }
                    ].map((level) => (
                        <div
                            key={level.id}
                            onClick={() => setSkillLevel(level.id)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${skillLevel === level.id
                                    ? 'bg-lime-400/10 border-lime-400'
                                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                                }`}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className={`font-bold ${skillLevel === level.id ? 'text-lime-400' : 'text-white'}`}>
                                        {level.label}
                                    </h4>
                                    <p className="text-xs text-slate-400">{level.desc}</p>
                                </div>
                                {skillLevel === level.id && <Check size={18} className="text-lime-400" />}
                            </div>
                        </div>
                    ))}
                </div>
            )
        },
        {
            id: 3,
            title: "Sẵn sàng ra sân!",
            desc: "Bạn đã hoàn tất thiết lập. Hãy đặt sân ngay bây giờ.",
            icon: Star,
            content: (
                <div className="text-center py-8">
                    <div className="w-20 h-20 bg-lime-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(163,230,53,0.3)]">
                        <Check size={40} className="text-slate-900" />
                    </div>
                    <p className="text-slate-300">
                        Tài khoản của bạn đã được kích hoạt và tặng sẵn <span className="text-lime-400 font-bold">200k</span> trong ví.
                    </p>
                </div>
            )
        }
    ];

    const currentStep = steps[step - 1];

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Progress Bar */}
                <div className="flex gap-2 mb-8">
                    {steps.map((s) => (
                        <div
                            key={s.id}
                            className={`h-1 flex-1 rounded-full transition-colors ${s.id <= step ? 'bg-lime-400' : 'bg-slate-800'
                                }`}
                        />
                    ))}
                </div>

                <AnimatePresence mode='wait'>
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm"
                    >
                        <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mb-4">
                            <currentStep.icon size={24} className="text-lime-400" />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2">{currentStep.title}</h2>
                        <p className="text-slate-400 mb-6 text-sm">{currentStep.desc}</p>

                        {currentStep.content}

                        <Button
                            className="w-full mt-8"
                            onClick={handleNext}
                            disabled={loading || (step === 1 && !name)}
                        >
                            {loading ? 'Đang xử lý...' : step === 3 ? 'Bắt đầu ngay' : 'Tiếp tục'}
                            {!loading && step < 3 && <ArrowRight size={18} className="ml-2" />}
                        </Button>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
