import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Play, Globe, Lock, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageTransition } from '../components/Layout/PageTransition';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ApiService } from '../services/api';
import { Highlight, User } from '../types';

export const MyHighlights: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [highlights, setHighlights] = useState<Highlight[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [userRes, highlightsRes] = await Promise.all([
                ApiService.getCurrentUser(),
                ApiService.getHighlights(50)
            ]);

            if (userRes.success) setUser(userRes.data);
            if (highlightsRes.success) {
                // Filter only user's own highlights
                const myHighlights = highlightsRes.data.filter(h => h.userId === userRes.data?.id);
                setHighlights(myHighlights);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSpinner fullScreen />;

    const publicCount = highlights.filter(h => h.isPublic).length;
    const privateCount = highlights.length - publicCount;

    return (
        <PageTransition>
            <div className="min-h-screen bg-slate-900 pb-24">
                {/* Header */}
                <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
                    <div className="flex items-center justify-between p-4">
                        <button onClick={() => navigate('/home')} className="p-2 hover:bg-slate-800 rounded-full">
                            <ChevronLeft size={24} className="text-white" />
                        </button>
                        <h1 className="text-lg font-bold text-white">Thư viện của tôi</h1>
                        <div className="w-10" /> {/* Spacer */}
                    </div>
                </div>

                {/* Profile Section */}
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-4 mb-6">
                        <img
                            src={user?.avatar}
                            alt={user?.name}
                            className="w-20 h-20 rounded-full object-cover ring-2 ring-lime-400"
                        />
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-white mb-1">{user?.name}</h2>
                            <p className="text-slate-400 text-sm">@{user?.name?.toLowerCase().replace(/\s+/g, '')}</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">{highlights.length}</div>
                            <div className="text-xs text-slate-400">Highlights</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-lime-400">{publicCount}</div>
                            <div className="text-xs text-slate-400">Công khai</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-slate-400">{privateCount}</div>
                            <div className="text-xs text-slate-400">Riêng tư</div>
                        </div>
                    </div>
                </div>

                {/* Highlights Grid */}
                <div className="p-4">
                    {highlights.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="text-slate-500 mb-2">Chưa có highlight nào</div>
                            <button
                                onClick={() => navigate('/home')}
                                className="text-lime-400 text-sm font-medium"
                            >
                                Bắt đầu chơi để tạo highlight
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-1">
                            {highlights.map((highlight) => (
                                <HighlightGridItem
                                    key={highlight.id}
                                    highlight={highlight}
                                    onClick={() => navigate('/gallery')}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PageTransition>
    );
};

interface HighlightGridItemProps {
    highlight: Highlight;
    onClick: () => void;
}

const HighlightGridItem: React.FC<HighlightGridItemProps> = ({ highlight, onClick }) => {
    const [isPublic, setIsPublic] = useState(highlight.isPublic !== false);

    const togglePrivacy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const newPrivacy = !isPublic;
        setIsPublic(newPrivacy);

        const result = await ApiService.updateHighlightPrivacy(highlight.id, newPrivacy);
        if (!result.success) {
            setIsPublic(!newPrivacy);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="relative aspect-[9/16] bg-slate-800 rounded-lg overflow-hidden cursor-pointer group"
        >
            {/* Thumbnail */}
            <img
                src={highlight.thumbnailUrl}
                alt="Highlight"
                className="w-full h-full object-cover"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Privacy Badge - Top Right */}
            <button
                onClick={togglePrivacy}
                className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all ${isPublic
                        ? 'bg-lime-500/30 text-lime-400'
                        : 'bg-slate-800/60 text-slate-300'
                    }`}
            >
                {isPublic ? <Globe size={14} /> : <Lock size={14} />}
            </button>

            {/* Duration - Bottom Left */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-bold bg-black/60 px-2 py-1 rounded-full">
                <Play size={10} className="fill-white" />
                {formatDuration(highlight.durationSec)}
            </div>

            {/* Views - Bottom Right */}
            <div className="absolute bottom-2 right-2 text-white text-xs font-bold bg-black/60 px-2 py-1 rounded-full">
                {highlight.views} views
            </div>
        </motion.div>
    );
};
