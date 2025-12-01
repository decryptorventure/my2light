import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Grid3x3, Heart, Bookmark, Share2, Edit3,
    MoreHorizontal, Settings, Camera, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition } from '../components/Layout/PageTransition';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { authService, highlightsService } from '../src/api';
import { Highlight, User } from '../types';

type Tab = 'posts' | 'saved' | 'liked';

export const MyHighlights: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [activeTab, setActiveTab] = useState<Tab>('posts');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            // 1. Get User First
            const userRes = await authService.getCurrentUser();
            if (userRes.success && userRes.data) {
                setUser(userRes.data);

                // 2. Get User's Highlights
                const highlightsRes = await highlightsService.getUserHighlights(userRes.data.id, 50);
                if (highlightsRes.success) {
                    setHighlights(highlightsRes.data);
                }
            }

            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSpinner fullScreen />;

    const totalLikes = highlights.reduce((sum, h) => sum + h.likes, 0);

    return (
        <PageTransition>
            <div className="min-h-screen bg-slate-900 pb-24 text-white">
                {/* Header */}
                <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md pt-safe">
                    <div className="flex items-center justify-between px-4 py-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 flex items-center justify-center hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <h1 className="text-lg font-bold">{user?.name}</h1>
                        <div className="flex gap-2">
                            <button className="w-10 h-10 flex items-center justify-center hover:bg-slate-800 rounded-full transition-colors">
                                <Settings size={24} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Profile Info */}
                <div className="px-4 pb-6">
                    <div className="flex flex-col items-center mb-6">
                        <div className="relative mb-4">
                            <img
                                src={user?.avatar || 'https://cdn-icons-png.flaticon.com/512/3307/3307873.png'}
                                alt={user?.name}
                                className="w-24 h-24 rounded-full object-cover border-4 border-slate-900 ring-2 ring-slate-700"
                            />
                            <button className="absolute bottom-0 right-0 bg-lime-400 text-slate-900 p-1.5 rounded-full border-4 border-slate-900">
                                <Edit3 size={14} />
                            </button>
                        </div>
                        <h2 className="text-xl font-bold mb-1">@{user?.name?.toLowerCase().replace(/\s+/g, '')}</h2>
                        <p className="text-slate-400 text-sm">Badminton Player & Enthusiast 🏸</p>
                    </div>

                    {/* Stats Row */}
                    <div className="flex justify-around items-center mb-8 px-4">
                        <div className="flex flex-col items-center">
                            <span className="font-bold text-lg">{highlights.length}</span>
                            <span className="text-xs text-slate-400">Posts</span>
                        </div>
                        <div className="w-px h-8 bg-slate-800" />
                        <button
                            onClick={() => navigate('/social/connections?tab=followers')}
                            className="flex flex-col items-center"
                        >
                            <span className="font-bold text-lg">{user?.followersCount || 0}</span>
                            <span className="text-xs text-slate-400">Followers</span>
                        </button>
                        <div className="w-px h-8 bg-slate-800" />
                        <button
                            onClick={() => navigate('/social/connections?tab=following')}
                            className="flex flex-col items-center"
                        >
                            <span className="font-bold text-lg">{user?.followingCount || 0}</span>
                            <span className="text-xs text-slate-400">Following</span>
                        </button>
                        <div className="w-px h-8 bg-slate-800" />
                        <div className="flex flex-col items-center">
                            <span className="font-bold text-lg">{totalLikes}</span>
                            <span className="text-xs text-slate-400">Likes</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mb-2">
                        <Button
                            className="flex-1 bg-lime-400 hover:bg-lime-500 text-slate-900 font-bold"
                            onClick={() => navigate('/profile/edit')}
                        >
                            Edit Profile
                        </Button>
                        <Button
                            variant="secondary"
                            className="flex-1 bg-slate-800 hover:bg-slate-700 border-slate-700"
                            onClick={() => { }}
                        >
                            Share Profile
                        </Button>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="bg-slate-800 hover:bg-slate-700 border-slate-700 w-12"
                        >
                            <MoreHorizontal size={20} />
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-t border-slate-800">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`flex-1 py-3 flex justify-center border-b-2 transition-colors ${activeTab === 'posts' ? 'border-lime-400 text-lime-400' : 'border-transparent text-slate-500'
                                }`}
                        >
                            <Grid3x3 size={24} />
                        </button>
                        <button
                            onClick={() => setActiveTab('saved')}
                            className={`flex-1 py-3 flex justify-center border-b-2 transition-colors ${activeTab === 'saved' ? 'border-lime-400 text-lime-400' : 'border-transparent text-slate-500'
                                }`}
                        >
                            <Bookmark size={24} />
                        </button>
                        <button
                            onClick={() => setActiveTab('liked')}
                            className={`flex-1 py-3 flex justify-center border-b-2 transition-colors ${activeTab === 'liked' ? 'border-lime-400 text-lime-400' : 'border-transparent text-slate-500'
                                }`}
                        >
                            <Heart size={24} />
                        </button>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="min-h-[300px]">
                    {highlights.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                            <Camera size={48} className="mb-4 opacity-20" />
                            <p>Chưa có bài đăng nào</p>
                            <Button
                                variant="ghost"
                                className="mt-4 text-lime-400"
                                onClick={() => navigate('/self-recording')}
                            >
                                Tạo highlight ngay
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-0.5">
                            {highlights.map((highlight) => (
                                <motion.div
                                    key={highlight.id}
                                    layoutId={highlight.id}
                                    onClick={() => navigate('/gallery')}
                                    className="relative aspect-[3/4] bg-slate-800 cursor-pointer group overflow-hidden"
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
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PageTransition>
    );
};
