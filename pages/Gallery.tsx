import React, { useState, useEffect } from 'react';
import { Heart, Share2, Download, Play, Pause, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/Layout/PageTransition';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ApiService } from '../services/mockDb';
import { Highlight } from '../types';

export const Gallery: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  
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
        {highlights.map((highlight, index) => (
          <VideoItem key={highlight.id} highlight={highlight} />
        ))}
      </div>
    </PageTransition>
  );
};

const VideoItem: React.FC<{ highlight: Highlight }> = ({ highlight }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(highlight.isLiked || false);
  const [likesCount, setLikesCount] = useState(highlight.likes);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if(liked) {
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
             <button className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/5 text-white">
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
                 <p className="text-white font-bold drop-shadow-md text-base">@{highlight.userName?.replace(/\s/g, '').toLowerCase()}</p>
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
    </div>
  );
};
