import React, { useState, useEffect, useRef } from 'react';
import {
    Heart, Share2, MessageCircle, Bookmark, X, Play, Zap
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Highlight, HighlightEvent } from '../../../types';
import { SocialService } from '../../../services/social';
import { celebrate } from '../../../lib/confetti';
import { CommentSection } from '../../../components/social/CommentSection';
import { useToast } from '../../../components/ui/Toast';
import { LikeAnimation } from '../../../components/ui/LikeAnimation';

interface VideoFeedItemProps {
    highlight: Highlight;
    isActive?: boolean;
    onBack?: () => void;
}

export const VideoFeedItem: React.FC<VideoFeedItemProps> = ({ highlight, isActive = true, onBack }) => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPreviewMode, setIsPreviewMode] = useState(true);
    const [liked, setLiked] = useState(highlight.isLiked || false);
    const [saved, setSaved] = useState(false);
    const [likesCount, setLikesCount] = useState(highlight.likes);
    const [showComments, setShowComments] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [showLikeAnim, setShowLikeAnim] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    const [showHighlightList, setShowHighlightList] = useState(false);
    const hasHighlights = highlight.highlightEvents && highlight.highlightEvents.length > 0;

    // Swipe gesture
    const x = useMotionValue(0);
    const opacity = useTransform(x, [-150, 0, 150], [0.5, 1, 0.5]);

    // Auto-play control
    useEffect(() => {
        if (isActive && videoRef.current) {
            videoRef.current.play().catch(() => {
                // Auto-play might fail if not muted
            });
            setIsPlaying(true);
        } else if (!isActive && videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, [isActive]);

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            setDuration(videoRef.current.duration || 0);

            if (isPreviewMode) {
                if (videoRef.current.currentTime >= 5) {
                    videoRef.current.currentTime = 0;
                    videoRef.current.play();
                }
            }
        }
    };

    const handleSeek = (timestamp: number) => {
        if (videoRef.current) {
            // Seek to 5 seconds before the highlight to give context
            videoRef.current.currentTime = Math.max(0, timestamp - 5);
            videoRef.current.play();
            setIsPreviewMode(false);
            videoRef.current.muted = false;
            setIsPlaying(true);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const togglePlay = (e: React.MouseEvent) => {
        if (e.detail === 2) return; // Handled by double tap

        if (videoRef.current) {
            if (isPreviewMode) {
                // Switch to full view mode
                setIsPreviewMode(false);
                videoRef.current.muted = false;
                videoRef.current.currentTime = 0;
                videoRef.current.play();
                setIsPlaying(true);
            } else {
                // Normal toggle
                if (isPlaying) {
                    videoRef.current.pause();
                } else {
                    videoRef.current.play();
                }
                setIsPlaying(!isPlaying);
            }
        }
    };

    const handleLike = async () => {
        if (!liked) {
            celebrate({ particleCount: 20, spread: 40 });
            setShowLikeAnim(true);
        }

        // Optimistic update
        const newLikedState = !liked;
        setLiked(newLikedState);
        setLikesCount((prev: number) => newLikedState ? prev + 1 : prev - 1);

        // API call
        if (newLikedState) {
            await SocialService.likeHighlight(highlight.id);
        } else {
            await SocialService.unlikeHighlight(highlight.id);
        }
    };

    const handleDoubleTap = (e: React.MouseEvent) => {
        if (e.detail === 2) {
            if (!liked) handleLike();
            else setShowLikeAnim(true);
        }
    };

    const handleSave = () => {
        setSaved(!saved);
        showToast(saved ? 'Đã bỏ lưu' : 'Đã lưu highlight', 'success');
    };

    return (
        <motion.div
            className="h-full w-full flex items-center justify-center relative bg-black"
            style={{ opacity }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={(e, { offset, velocity }) => {
                if (Math.abs(offset.x) > 150 && onBack) {
                    onBack();
                }
                x.set(0);
            }}
            onClick={handleDoubleTap}
        >
            {/* Video */}
            <video
                ref={videoRef}
                src={highlight.videoUrl}
                poster={highlight.thumbnailUrl}
                className="w-full h-full object-contain"
                loop={!isPreviewMode}
                playsInline
                muted={isPreviewMode}
                preload="metadata"
                onClick={togglePlay}
                onTimeUpdate={handleTimeUpdate}
            />

            <LikeAnimation isActive={showLikeAnim} onComplete={() => setShowLikeAnim(false)} />

            {/* Highlight List Overlay */}
            <AnimatePresence>
                {showHighlightList && hasHighlights && (
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute top-36 right-4 bottom-48 w-64 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden flex flex-col z-30"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-white text-sm">Highlights ({highlight.highlightEvents?.length})</h3>
                            <button onClick={() => setShowHighlightList(false)} className="text-slate-400 hover:text-white">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {highlight.highlightEvents?.map((event: HighlightEvent, index: number) => (
                                <button
                                    key={index}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSeek(event.timestamp);
                                    }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors group text-left"
                                >
                                    <div className="w-8 h-8 rounded-full bg-lime-400/20 text-lime-400 flex items-center justify-center text-xs font-bold group-hover:bg-lime-400 group-hover:text-slate-900 transition-colors">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-white">Pha bóng {index + 1}</div>
                                        <div className="text-xs text-slate-400">{formatTime(event.timestamp)}</div>
                                    </div>
                                    <Play size={12} className="ml-auto text-slate-500 group-hover:text-lime-400" />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Play overlay */}
            {!isPlaying && !isPreviewMode && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/20"
                    onClick={togglePlay}
                >
                    <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <div className="w-0 h-0 ml-1 border-t-[12px] border-t-transparent border-l-[20px] border-l-slate-900 border-b-[12px] border-b-transparent" />
                    </div>
                </motion.div>
            )}

            {/* Preview Indicator */}
            {isPreviewMode && isPlaying && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium border border-white/20 animate-pulse">
                        Chạm để xem đầy đủ
                    </div>
                </div>
            )}

            {/* Bottom gradient overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 pb-8 pointer-events-none z-10">
                <div className="flex items-end gap-4 pointer-events-auto">
                    {/* Info */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <img
                                src={highlight.userAvatar || 'https://cdn-icons-png.flaticon.com/512/3307/3307873.png'}
                                alt="User"
                                loading="lazy"
                                className="w-10 h-10 rounded-full border-2 border-white/30"
                            />
                            <span className="text-white font-bold drop-shadow-md cursor-pointer hover:underline" onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/player/${highlight.userId}`);
                            }}>
                                {highlight.userName}
                            </span>
                        </div>
                        <h2 className="text-white font-bold text-sm mb-1 line-clamp-2 drop-shadow-md">
                            {highlight.title}
                        </h2>
                        <p className="text-white/90 text-xs line-clamp-2 drop-shadow-md">
                            {highlight.description}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-center gap-4">
                        {/* Highlight List Button */}
                        {hasHighlights && (
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowHighlightList(!showHighlightList);
                                }}
                                className="flex flex-col items-center gap-1"
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg backdrop-blur-md ${showHighlightList ? 'bg-orange-500 text-white' : 'bg-white/20 backdrop-blur-md'}`}>
                                    <div className="relative">
                                        <Zap size={20} className={showHighlightList ? 'fill-white' : 'text-white'} />
                                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-black" />
                                    </div>
                                </div>
                                <span className="text-xs text-white font-bold">Highlight</span>
                            </motion.button>
                        )}

                        {/* Like */}
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={handleLike}
                            className="flex flex-col items-center gap-1"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${liked ? 'bg-red-500' : 'bg-white/20 backdrop-blur-md'
                                }`}>
                                <Heart
                                    size={20}
                                    className={liked ? 'fill-white text-white' : 'text-white'}
                                />
                            </div>
                            <span className="text-xs text-white font-bold tabular-nums">{likesCount}</span>
                        </motion.button>

                        {/* Comment */}
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowComments(true)}
                            className="flex flex-col items-center gap-1"
                        >
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-colors">
                                <MessageCircle size={20} className="text-white" />
                            </div>
                            <span className="text-xs text-white font-bold">0</span>
                        </motion.button>

                        {/* Share */}
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowShare(true)}
                            className="flex flex-col items-center gap-1"
                        >
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-colors">
                                <Share2 size={20} className="text-white" />
                            </div>
                            <span className="text-xs text-white font-bold">Share</span>
                        </motion.button>

                        {/* Save */}
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={handleSave}
                            className="flex flex-col items-center gap-1"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${saved ? 'bg-lime-400' : 'bg-white/20 backdrop-blur-md'
                                }`}>
                                <Bookmark
                                    size={20}
                                    className={saved ? 'fill-slate-900 text-slate-900' : 'text-white'}
                                />
                            </div>
                        </motion.button>
                    </div>
                </div>
            </div>

            <CommentSection
                highlightId={highlight.id}
                isOpen={showComments}
                onClose={() => setShowComments(false)}
            />
        </motion.div>
    );
};
