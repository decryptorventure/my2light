import React, { useState, useEffect, useRef } from 'react';
import {
  Heart, Share2, Download, MessageCircle, ChevronLeft,
  Eye, TrendingUp, Users, Bookmark, MoreVertical, X
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/Layout/PageTransition';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { ApiService } from '../services/api';
import { Highlight } from '../types';
import { celebrate } from '../lib/confetti';

export const Gallery: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'mine' | 'trending' | 'friends'>('all');

  useEffect(() => {
    const fetchHighlights = async () => {
      setLoading(true);
      const res = await ApiService.getHighlights(20);
      if (res.success) {
        setHighlights(res.data);
      }
      setLoading(false);
    };
    fetchHighlights();
  }, [activeFilter]);

  const filters = [
    { id: 'all', label: 'Tất cả', icon: Eye },
    { id: 'mine', label: 'Của tôi', icon: Bookmark },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'friends', label: 'Bạn bè', icon: Users }
  ];

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <PageTransition>
      <div className="fixed inset-0 bg-black">
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 via-black/60 to-transparent pt-safe">
          <div className="flex items-center justify-between p-4 pb-2">
            <button
              onClick={() => navigate('/home')}
              className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-lg font-black text-white">Gallery</h1>
            <div className="w-10" />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
            {filters.map((filter) => {
              const Icon = filter.icon;
              const isActive = activeFilter === filter.id;

              return (
                <motion.button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id as any)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${isActive
                    ? 'bg-lime-400 text-slate-900'
                    : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon size={16} />
                  <span>{filter.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Video Feed */}
        <div className="h-screen overflow-y-scroll snap-y snap-mandatory no-scrollbar pt-28 pb-24">
          {highlights.length === 0 ? (
            <div className="flex h-full items-center justify-center text-slate-500">
              Chưa có highlight nào
            </div>
          ) : (
            highlights.map((highlight, index) => (
              <VideoCard key={highlight.id} highlight={highlight} index={index} />
            ))
          )}
        </div>
      </div>
    </PageTransition>
  );
};

interface VideoCardProps {
  highlight: Highlight;
  index: number;
}

const VideoCard: React.FC<VideoCardProps> = ({ highlight, index }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [liked, setLiked] = useState(highlight.isLiked || false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(highlight.likes);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Swipe gesture
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-150, 0, 150], [0.5, 1, 0.5]);

  // Auto-play preview when mounted
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && videoRef.current) {
            videoRef.current.play().catch(() => {
              // Auto-play might fail if not muted, but we set muted={true} initially
            });
            setIsPlaying(true);
          } else if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.6 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleTimeUpdate = () => {
    if (videoRef.current && isPreviewMode) {
      if (videoRef.current.currentTime >= 5) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
    }
  };

  const togglePlay = () => {
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
    }

    // Optimistic update
    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

    // API call
    await ApiService.toggleLike(highlight.id, likesCount, newLikedState);
  };

  const handleSave = () => {
    setSaved(!saved);
    // API call here
  };

  return (
    <motion.div
      className="h-screen snap-start flex items-center justify-center relative bg-black"
      style={{ opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={(e, { offset, velocity }) => {
        if (Math.abs(offset.x) > 150) {
          // Skip to next/previous
        }
        x.set(0);
      }}
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
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
      />

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
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 pb-8">
        <div className="flex items-end gap-4">
          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <img
                src={highlight.userAvatar || 'https://cdn-icons-png.flaticon.com/512/3307/3307873.png'}
                alt="User"
                className="w-10 h-10 rounded-full border-2 border-white/30"
              />
              <div>
                <h3 className="font-bold text-white text-sm leading-tight">
                  {highlight.userName || 'Unknown'}
                </h3>
                <p className="text-xs text-slate-300">{highlight.courtName}</p>
              </div>
            </div>
            <p className="text-sm text-white/90 mb-2 line-clamp-2">
              {highlight.description || `Highlight ${index + 1}`}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Eye size={14} />
                {(highlight.views || Math.floor(Math.random() * 1000))} views
              </span>
              <span>•</span>
              <span>00:{highlight.durationSec}s</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center gap-4">
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
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                <MessageCircle size={20} className="text-white" />
              </div>
              <span className="text-xs text-white font-bold">
                {Math.floor(Math.random() * 20)}
              </span>
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

            {/* Share */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowShare(true)}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                <Share2 size={20} className="text-white" />
              </div>
            </motion.button>

            {/* More */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                <MoreVertical size={20} className="text-white" />
              </div>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Comments Modal */}
      <AnimatePresence>
        {showComments && (
          <CommentsModal
            onClose={() => setShowComments(false)}
            highlightId={highlight.id}
          />
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShare && (
          <ShareModal
            onClose={() => setShowShare(false)}
            highlight={highlight}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Comments Modal Component
const CommentsModal: React.FC<{ onClose: () => void; highlightId: string }> = ({ onClose, highlightId }) => {
  const [comment, setComment] = useState('');

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25 }}
      className="absolute inset-x-0 bottom-0 bg-slate-900 rounded-t-3xl z-50 max-h-[70vh] overflow-y-auto"
    >
      <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
        <h3 className="font-bold text-white">Bình luận</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X size={24} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="text-center text-slate-500 text-sm py-8">
          Chưa có bình luận nào
        </div>
      </div>

      <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 p-4 pb-safe">
        <div className="flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Thêm bình luận..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-full px-4 py-2 text-white focus:outline-none focus:border-lime-400"
          />
          <Button variant="primary" size="icon" className="rounded-full">
            <MessageCircle size={20} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Share Modal Component
const ShareModal: React.FC<{ onClose: () => void; highlight: Highlight }> = ({ onClose, highlight }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-end z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        className="w-full bg-slate-900 rounded-t-3xl p-6 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-white mb-4 text-center">Chia sẻ</h3>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <ShareButton icon={Download} label="Tải về" />
          <ShareButton icon={MessageCircle} label="Message" />
          <ShareButton icon={Share2} label="Link" />
        </div>
        <Button variant="ghost" onClick={onClose} className="w-full">
          Hủy
        </Button>
      </motion.div>
    </motion.div>
  );
};

const ShareButton: React.FC<{ icon: any; label: string }> = ({ icon: Icon, label }) => (
  <button className="flex flex-col items-center gap-2">
    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center hover:bg-slate-700 transition-colors">
      <Icon size={24} className="text-white" />
    </div>
    <span className="text-xs text-slate-400">{label}</span>
  </button>
);
