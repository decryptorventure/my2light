import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap, Sunrise, ThumbsUp, Flame } from 'lucide-react';

interface Badge {
    id: string;
    icon: React.ElementType;
    label: string;
    color: string;
    unlocked: boolean;
    description: string;
    condition: string;
}

import { Modal } from './Modal';
import { useAuthStore } from '../../stores/authStore';

export const Badges: React.FC = () => {
    const [selectedBadge, setSelectedBadge] = React.useState<Badge | null>(null);
    const { user } = useAuthStore();

    const badges: Badge[] = [
        {
            id: '1',
            icon: Flame,
            label: 'Smasher',
            color: 'text-red-500',
            unlocked: true,
            description: 'Bạn là một tay đập cầu cự phách!',
            condition: 'Có trên 10 video highlight Smash.'
        },
        {
            id: '2',
            icon: Sunrise,
            label: 'Early Bird',
            color: 'text-yellow-400',
            unlocked: true,
            description: 'Chăm chỉ luyện tập vào buổi sáng.',
            condition: 'Đặt sân trước 7:00 sáng 5 lần.'
        },
        {
            id: '3',
            icon: ThumbsUp,
            label: 'Fair Play',
            color: 'text-blue-400',
            unlocked: true,
            description: 'Luôn chơi đẹp và tôn trọng đối thủ.',
            condition: 'Được đánh giá 5 sao 10 lần liên tiếp.'
        },
        {
            id: '4',
            icon: Trophy,
            label: 'Champion',
            color: 'text-purple-500',
            unlocked: false,
            description: 'Nhà vô địch của các giải đấu.',
            condition: 'Vô địch 1 giải đấu bất kỳ trên hệ thống.'
        },
        {
            id: '5',
            icon: Zap,
            label: 'Speedy',
            color: 'text-lime-400',
            unlocked: false,
            description: 'Phản xạ nhanh như chớp.',
            condition: 'Có highlight phản tạt với tốc độ cao.'
        },
    ];

    return (
        <>
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Thành tích</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                    {badges.map((badge) => {
                        const Icon = badge.icon;
                        return (
                            <motion.div
                                key={badge.id}
                                whileHover={{ y: -2 }}
                                onClick={() => setSelectedBadge(badge)}
                                className={`flex flex-col items-center gap-2 min-w-[60px] cursor-pointer ${badge.unlocked ? 'opacity-100' : 'opacity-30 grayscale'}`}
                            >
                                <div className={`w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shadow-lg`}>
                                    <Icon size={20} className={badge.color} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-300 text-center leading-tight">
                                    {badge.label}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Badge Detail Modal */}
            <Modal
                isOpen={!!selectedBadge}
                onClose={() => setSelectedBadge(null)}
                title={selectedBadge?.label || ''}
            >
                <div className="flex flex-col items-center text-center space-y-4">
                    {selectedBadge && (
                        <>
                            <div className={`w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700 shadow-2xl ${!selectedBadge.unlocked && 'grayscale opacity-50'}`}>
                                <selectedBadge.icon size={48} className={selectedBadge.color} />
                            </div>

                            <div>
                                <h4 className="text-xl font-bold text-white mb-1">{selectedBadge.label}</h4>
                                <p className="text-slate-400 text-sm">{selectedBadge.description}</p>
                            </div>

                            <div className="w-full bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-2">Điều kiện mở khóa</p>
                                <p className="text-sm text-white font-medium">{selectedBadge.condition}</p>
                            </div>

                            {selectedBadge.unlocked ? (
                                <div className="flex items-center gap-2 text-lime-400 bg-lime-400/10 px-4 py-2 rounded-full">
                                    <ThumbsUp size={16} />
                                    <span className="text-sm font-bold">Đã đạt được bởi {user?.name || 'Bạn'}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-slate-500 bg-slate-800 px-4 py-2 rounded-full">
                                    <span className="text-sm font-bold">Chưa mở khóa</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Modal>
        </>
    );
};
