
import React, { useState, useEffect } from 'react';
import { Heart, Share2, Download, Play, Pause, ChevronLeft, Link as LinkIcon, Facebook, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/Layout/PageTransition';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ApiService } from '../services/api';
import { Highlight } from '../types';

export const Gallery: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  useEffect(() => {
    const fetchHighlights = async () => {
      setLoading(true);
      // Fetch real highlights from Supabase
      const res = await ApiService.getHighlights(20);
      if (res.success) {
        setHighlights(res.data);
      }
      setLoading(false);
    };
    fetchHighlights();
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <PageTransition>
      <div className="fixed top-0 left-0 p-4 z-30">
        <button onClick={() => navigate('/home')} className="bg-black/20 backdrop-blur-md p-2 rounded-full text-white">
          <ChevronLeft />
        </button>
      </div>
      <div className="h-screen bg-black overflow-y-scroll snap-y snap-mandatory no-scrollbar pb-[calc(env(safe-area-inset-bottom)+5rem)]">
        {highlights.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-500">
            Chưa có highlight nào.
          </div>
        ) : (
          highlights.map((highlight, index) => (
            <VideoItem key={highlight.id} highlight={highlight} />
          ))
        )}
      </div>
    </PageTransition>
  );
};

const VideoItem: React.FC<{ highlight: Highlight }> = ({ highlight }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(highlight.isLiked || false);
  const [likesCount, setLikesCount] = useState(highlight.likes);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liked) {
      setLikesCount(p => p - 1);
    } else {
      setLikesCount(p => p + 1);
    }
    setLiked(!liked);
  };

  return (
    <div className="relative w-full h-screen snap-start bg-slate-900 overflow-hidden border-b border-slate-800">
      {/* Video Placeholder */}
      <div
        onClick={togglePlay}
        className="absolute inset-0 cursor-pointer"
      >
        <img src={highlight.thumbnailUrl} alt="Video Thumbnail" className="w-full h-full object-cover opacity-80" />
        {/* Simulated Video Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90" />

        {/* Play/Pause Indicator (Simulated) */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-full ring-1 ring-white/20">
              <Play size={32} className="fill-white text-white translate-x-1" />
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar Actions */}
      <div className="absolute bottom-28 right-4 flex flex-col items-center gap-6 z-20">
        <div className="flex flex-col items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={toggleLike}
            className={`p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/5 ${liked ? 'text-red-500' : 'text-white'}`}
          >
            <Heart size={28} className={liked ? 'fill-current' : ''} strokeWidth={2.5} />
          </motion.button>
          <span className="text-white text-xs font-bold drop-shadow-md">{likesCount}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => setIsShareOpen(true)}
            className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/5 text-white active:bg-white/10"
          >
            <Share2 size={24} strokeWidth={2.5} />
          </button>
          <span className="text-white text-xs font-bold drop-shadow-md">Chia sẻ</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/5 text-white">
            <Download size={24} strokeWidth={2.5} />
          </button>
          <span className="text-white text-xs font-bold drop-shadow-md">Lưu</span>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-24 left-4 right-20 z-20 pointer-events-none">
        <div className="flex items-center gap-3 mb-3 pointer-events-auto">
          <img src={highlight.userAvatar} alt="User" className="w-10 h-10 rounded-full border-2 border-white shadow-md" />
          <div>
            <p className="text-white font-bold drop-shadow-md text-base">@{highlight.userName?.replace(/\s/g, '').toLowerCase() || 'user'}</p>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-slate-900 font-bold bg-lime-400 px-2 py-0.5 rounded-md backdrop-blur-sm">
                {highlight.courtName}
              </p>
              <p className="text-[10px] text-slate-300 font-medium">
                {new Date(highlight.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
        </div>
        <p className="text-white/90 text-sm line-clamp-2 drop-shadow-md mb-3 font-medium">
          Highlight đỉnh cao! Pha xử lý 10 điểm không có nhưng 🔥 #pickleball #my2light
        </p>

        {/* Scrubber (Visual Only) */}
        <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
          <div className={`h-full bg-lime-400 w-1/2 ${isPlaying ? 'animate-[shimmer_2s_infinite]' : ''}`} />
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {isShareOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 bg-slate-900 rounded-t-3xl z-50 p-6 pb-safe-bottom"
            >
              <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-6" />
              <h3 className="text-white font-bold text-center mb-6">Chia sẻ highlight</h3>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <button className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 bg-[#1877F2] rounded-full flex items-center justify-center text-white">
                    <Facebook />
                  </div>
                  <span className="text-xs text-slate-400">Facebook</span>
                </button>
                <button className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 bg-[#0068FF] rounded-full flex items-center justify-center text-white font-bold text-xl">
                    Z
                  </div>
                  <span className="text-xs text-slate-400">Zalo</span>
                </button>
                <button className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 bg-gradient-to-tr from-yellow-400 to-red-600 rounded-full flex items-center justify-center text-white">
                    <MessageCircle />
                  </div>
                  <span className="text-xs text-slate-400">Instagram</span>
                </button>
                <button className="flex flex-col items-center gap-2" onClick={() => {
                  navigator.clipboard.writeText("https://my2light.app/v/123");
                  setIsShareOpen(false);
                  alert("Đã sao chép link!");
                }}>
                  <div className="w-14 h-14 bg-slate-700 rounded-full flex items-center justify-center text-white">
                    <LinkIcon />
                  </div>
                  <span className="text-xs text-slate-400">Sao chép</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
