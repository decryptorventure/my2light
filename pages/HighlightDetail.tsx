import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Heart, MessageCircle, Share2, MoreVertical } from 'lucide-react';
import { ApiService } from '../services/api';
import { SocialService } from '../services/social';
import { Highlight } from '../types';
import { SkeletonHighlightCard } from '../components/ui/Skeleton';
import { CommentSection } from '../components/social/CommentSection';
import { LikeAnimation } from '../components/ui/LikeAnimation';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale/vi';

export const HighlightDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [highlight, setHighlight] = useState<Highlight | null>(null);
    const [loading, setLoading] = useState(true);
    const [showComments, setShowComments] = useState(false);
    const [showLikeAnim, setShowLikeAnim] = useState(false);

    useEffect(() => {
        if (id) {
            loadHighlight();
        }
    }, [id]);

    const loadHighlight = async () => {
        setLoading(true);
        const res = await ApiService.getHighlights(100);
        if (res.success) {
            const found = res.data.find(h => h.id === id);
            if (found) {
                setHighlight(found);
            }
        }
        setLoading(false);
    };

    const handleLike = async () => {
        if (!highlight) return;
        const newIsLiked = !highlight.isLiked;

        if (newIsLiked) setShowLikeAnim(true);

        setHighlight(prev => prev ? {
            ...prev,
            isLiked: newIsLiked,
            likes: newIsLiked ? prev.likes + 1 : Math.max(0, prev.likes - 1)
        } : null);

        if (newIsLiked) {
            await SocialService.likeHighlight(highlight.id);
        } else {
            await SocialService.unlikeHighlight(highlight.id);
        }
    };

    const handleDoubleTap = (e: React.MouseEvent) => {
        if (e.detail === 2) {
            if (!highlight?.isLiked) handleLike();
            else setShowLikeAnim(true);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col">
                <div className="flex-1 flex items-center justify-center bg-slate-900 animate-pulse">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-lime-400 animate-spin" />
                </div>
                <div className="bg-slate-900 p-4 pb-safe border-t border-slate-800">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-4 w-32 bg-slate-800 rounded animate-pulse" />
                            <div className="h-3 w-20 bg-slate-800 rounded animate-pulse" />
                        </div>
                    </div>
                    <div className="h-4 w-full bg-slate-800 rounded animate-pulse mb-2" />
                    <div className="h-4 w-2/3 bg-slate-800 rounded animate-pulse" />
                </div>
            </div>
        );
    }

    if (!highlight) return <div className="text-center pt-20 text-white">Video không tồn tại</div>;

    return (
        <div className="min-h-screen bg-black flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                <button onClick={() => navigate(-1)} className="text-white p-2 pointer-events-auto">
                    <ChevronLeft size={28} />
                </button>
                <button className="text-white p-2 pointer-events-auto">
                    <MoreVertical size={24} />
                </button>
            </div>

            {/* Video Player */}
            <div
                className="flex-1 flex items-center justify-center bg-black relative"
                onClick={handleDoubleTap}
            >
                <video
                    src={highlight.videoUrl}
                    className="w-full max-h-screen object-contain"
                    controls
                    autoPlay
                    loop
                    playsInline
                />
                <LikeAnimation isActive={showLikeAnim} onComplete={() => setShowLikeAnim(false)} />
            </div>

            {/* Info & Actions */}
            <div className="bg-slate-900 p-4 pb-safe border-t border-slate-800">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3" onClick={() => navigate(`/player/${highlight.userId}`)}>
                        <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                            <img src={highlight.userAvatar} alt={highlight.userName} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm">{highlight.userName}</h3>
                            <p className="text-slate-500 text-xs">
                                {formatDistanceToNow(new Date(highlight.createdAt), { addSuffix: true, locale: vi })}
                            </p>
                        </div>
                    </div>

                    <button className="bg-lime-400 text-slate-900 px-4 py-1.5 rounded-full text-xs font-bold">
                        Theo dõi
                    </button>
                </div>

                <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                    {highlight.title || 'Highlight tuyệt vời tại ' + highlight.courtName}
                </p>

                <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                    <div className="flex items-center gap-6">
                        <button onClick={handleLike} className="flex flex-col items-center gap-1">
                            <Heart
                                size={24}
                                className={highlight.isLiked ? "fill-red-500 text-red-500" : "text-white"}
                            />
                            <span className="text-xs text-slate-400">{highlight.likes}</span>
                        </button>
                        <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1">
                            <MessageCircle size={24} className="text-white" />
                            <span className="text-xs text-slate-400">Bình luận</span>
                        </button>
                        <button className="flex flex-col items-center gap-1">
                            <Share2 size={24} className="text-white" />
                            <span className="text-xs text-slate-400">Chia sẻ</span>
                        </button>
                    </div>

                    <div className="text-slate-500 text-xs">
                        {highlight.views} lượt xem
                    </div>
                </div>
            </div>

            <CommentSection
                highlightId={highlight.id}
                isOpen={showComments}
                onClose={() => setShowComments(false)}
            />
        </div>
    );
};
