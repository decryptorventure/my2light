import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    MessageCircle,
    UserPlus,
    UserMinus,
    Share2,
    MapPin,
    Trophy,
    Activity as ActivityIcon,
    Grid,
    BarChart2,
    Award,
    ChevronLeft,
    Play
} from 'lucide-react';
import { ApiService } from '../services/api';
import { SocialService } from '../services/social';
import { SocialProfile, Activity } from '../types/social';
import { Highlight } from '../types';
import { SkeletonProfileHeader, SkeletonCard } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { useAuthStore } from '../stores/authStore';

export const PlayerProfile: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();
    const { showToast } = useToast();

    const [profile, setProfile] = useState<SocialProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'highlights' | 'stats' | 'badges'>('highlights');
    const [highlights, setHighlights] = useState<Highlight[]>([]);

    useEffect(() => {
        if (userId) {
            loadProfile();
            loadActivities();
        }
    }, [userId]);

    const loadProfile = async () => {
        if (!userId) return;
        setLoading(true);
        const res = await SocialService.getPlayerProfile(userId);
        if (res.success && res.data) {
            setProfile(res.data);
        } else {
            showToast('Không tìm thấy người chơi', 'error');
            navigate(-1);
        }
        setLoading(false);
    };

    const loadActivities = async () => {
        if (!userId) return;
        const res = await ApiService.getUserHighlights(userId);
        if (res.success) {
            setHighlights(res.data);
        }
    };

    const handleFollow = async () => {
        if (!profile || !userId) return;

        if (profile.isFollowing) {
            const res = await SocialService.unfollowPlayer(userId);
            if (res.success) {
                setProfile(prev => prev ? { ...prev, isFollowing: false, followersCount: prev.followersCount - 1 } : null);
                showToast(`Đã hủy theo dõi ${profile.fullName}`, 'success');
            }
        } else {
            const res = await SocialService.followPlayer(userId);
            if (res.success) {
                // Note: If it requires approval, isFollowing might remain false until accepted
                // But for UI feedback we might show "Requested" state. 
                // For simplicity here, we assume direct follow or "Requested" toast.
                showToast('Đã gửi yêu cầu kết bạn', 'success');
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 pb-24">
                <div className="relative h-48 bg-slate-900 animate-pulse" />
                <div className="px-6 -mt-16 relative">
                    <SkeletonProfileHeader />
                    <div className="grid grid-cols-3 gap-1 mt-6">
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                </div>
            </div>
        );
    }

    if (!profile) return null;

    const isMe = currentUser?.id === userId;

    return (
        <div className="min-h-screen bg-slate-950 pb-24">
            {/* Header / Cover */}
            <div className="relative h-48 bg-gradient-to-br from-lime-400/20 via-slate-900 to-slate-900">
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-safe-top left-4 p-2 rounded-full bg-black/20 text-white backdrop-blur-sm z-10"
                >
                    <ChevronLeft size={24} />
                </button>
            </div>

            {/* Profile Info */}
                <div className="flex gap-2 mb-2">
                    {!isMe && (
                        <>
                            <Button
                                size="sm"
                                variant={profile.isFollowing ? "secondary" : "primary"}
                                onClick={handleFollow}
                                className="rounded-full px-6"
                            >
                                {profile.isFollowing ? (
                                    <>
                                        <UserMinus size={18} className="mr-2" />
                                        Đang theo dõi
                                    </>
                                ) : (
                                    <>
                                        <UserPlus size={18} className="mr-2" />
                                        Theo dõi
                                    </>
                                )}
                            </Button>
                            <Button size="sm" variant="secondary" className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
                                <MessageCircle size={20} />
                            </Button>
                        </>
                    )}
                    <Button size="sm" variant="ghost" className="rounded-full w-10 h-10 p-0 flex items-center justify-center text-slate-400">
                        <Share2 size={20} />
                    </Button>
                </div>
            </div>

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    {profile.fullName}
                    <span className="px-2 py-0.5 rounded bg-lime-400/10 text-lime-400 text-xs font-bold uppercase border border-lime-400/20">
                        {profile.skillLevel || 'Beginner'}
                    </span>
                </h1>
                {profile.bio && (
                    <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                        {profile.bio}
                    </p>
                )}

                <div className="flex items-center gap-6 mt-4 text-sm">
                    <div className="flex flex-col">
                        <span className="font-bold text-white text-lg">{profile.followersCount}</span>
                        <span className="text-slate-500 text-xs">Người theo dõi</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-white text-lg">{profile.followingCount}</span>
                        <span className="text-slate-500 text-xs">Đang theo dõi</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-white text-lg">0</span>
                        <span className="text-slate-500 text-xs">Trận đấu</span>
                    </div>
                </div>
            </div>

            {/* Tabs */ }
    <div className="flex border-b border-slate-800 mb-6">
        <button
            onClick={() => setActiveTab('highlights')}
            className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${activeTab === 'highlights' ? 'text-lime-400' : 'text-slate-500'
                }`}
        >
            <div className="flex items-center justify-center gap-2">
                <Grid size={18} />
                Highlights
            </div>
            {activeTab === 'highlights' && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400" />
            )}
        </button>
        <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${activeTab === 'stats' ? 'text-lime-400' : 'text-slate-500'
                }`}
        >
            <div className="flex items-center justify-center gap-2">
                <BarChart2 size={18} />
                Thống kê
            </div>
            {activeTab === 'stats' && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400" />
            )}
        </button>
        <button
            onClick={() => setActiveTab('badges')}
            className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${activeTab === 'badges' ? 'text-lime-400' : 'text-slate-500'
                }`}
        >
            <div className="flex items-center justify-center gap-2">
                <Award size={18} />
                Huy hiệu
            </div>
            {activeTab === 'badges' && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400" />
            )}
        </button>
    </div>

    {/* Content */ }
    <div className="min-h-[200px]">
        {activeTab === 'highlights' && (
            <div className="grid grid-cols-3 gap-1">
                {highlights.length === 0 ? (
                    <div className="col-span-3 text-center py-12 text-slate-500">
                        <ActivityIcon size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Chưa có highlight nào.</p>
                    </div>
                ) : (
                    highlights.map((highlight) => (
                        <div
                            key={highlight.id}
                            onClick={() => navigate(`/highlight/${highlight.id}`)}
                            className="aspect-[3/4] bg-slate-800 relative cursor-pointer group overflow-hidden"
                        >
                            <img
                                src={highlight.thumbnailUrl}
                                alt=""
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                            <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play size={12} className="fill-white" />
                                {highlight.views}
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}

        {activeTab === 'stats' && (
            <div className="text-center py-12 text-slate-500">
                <BarChart2 size={48} className="mx-auto mb-4 opacity-20" />
                <p>Người chơi chưa công khai thống kê.</p>
            </div>
        )}

        {activeTab === 'badges' && (
            <div className="text-center py-12 text-slate-500">
                <Award size={48} className="mx-auto mb-4 opacity-20" />
                <p>Chưa có huy hiệu nào.</p>
            </div>
        )}
    </div>

    );
};
