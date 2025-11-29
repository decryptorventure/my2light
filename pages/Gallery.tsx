import React, { useState, useEffect, useRef } from 'react';
import {
  Heart, Share2, MessageCircle, ChevronLeft,
  Eye, TrendingUp, Users, Bookmark, MoreVertical, X, Globe, Lock, List, Grid, Camera, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/Layout/PageTransition';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { ApiService } from '../services/api';
import { SocialService } from '../services/social';
import { Highlight } from '../types';
import { celebrate } from '../lib/confetti';
import { CommentSection } from '../components/social/CommentSection';
import { useToast } from '../components/ui/Toast';
import { LikeAnimation } from '../components/ui/LikeAnimation';
import { useHighlights, useCurrentUser } from '../hooks/useApi';
import { StatCircle } from '../components/ui/CircularProgress';

export const Gallery: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'all' | 'public' | 'private'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Data
  const { data: highlights = [], isLoading: loading } = useHighlights(50);
  const { data: user } = useCurrentUser();

  // Filter logic
  const filteredHighlights = highlights.filter(h => {
    if (activeFilter === 'public') return h.isPublic;
    if (activeFilter === 'private') return !h.isPublic;
    return true;
  });

  // Stats calculation
  const stats = {
    videos: highlights.length,
    views: highlights.reduce((acc, h) => acc + (h.views || 0), 0),
    likes: highlights.reduce((acc, h) => acc + (h.likes || 0), 0),
    public: highlights.filter(h => h.isPublic).length
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-900 pb-24">
        {/* Header */}
        <div className="bg-slate-900 sticky top-0 z-40 border-b border-slate-800">
          <div className="flex items-center justify-between p-4 pt-safe">
            <button
              onClick={() => navigate('/home')}
              className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft size={20} className="text-slate-300" />
            </button>
            <h1 className="text-lg font-bold text-white">Thư Viện Của Tôi</h1>
            <button className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
              <MoreVertical size={20} className="text-slate-300" />
            </button>
          </div>

          {/* User Info & Stats */}
          <div className="px-6 pb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-lime-400 p-0.5">
                  <img
                    src={user?.avatar || 'https://via.placeholder.com/150'}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-lime-400 rounded-full flex items-center justify-center border-2 border-slate-900">
                  <Camera size={12} className="text-slate-900" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{user?.name}</h2>
                <p className="text-slate-400 text-sm">@{user?.name?.toLowerCase().replace(/\s/g, '') || 'username'}</p>

                {/* Followers/Following - Added per request */}
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <button onClick={() => navigate('/social/connections?tab=followers')} className="flex items-center gap-1 hover:text-lime-400 transition-colors">
                    <span className="font-bold text-white">{user?.followersCount || 0}</span>
                    <span className="text-slate-500">Người theo dõi</span>
                  </button>
                  <button onClick={() => navigate('/social/connections?tab=following')} className="flex items-center gap-1 hover:text-lime-400 transition-colors">
                    <span className="font-bold text-white">{user?.followingCount || 0}</span>
                    <span className="text-slate-500">Đang theo dõi</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Circular Stats */}
            <div className="grid grid-cols-4 gap-2">
              <StatItem icon={<Play size={16} />} value={stats.videos} label="VIDEOS" color="text-lime-400" />
              <StatItem icon={<Eye size={16} />} value={stats.views} label="LƯỢT XEM" color="text-blue-400" />
              <StatItem icon={<Heart size={16} />} value={stats.likes} label="LƯỢT THÍCH" color="text-red-400" />
              <StatItem icon={<Globe size={16} />} value={stats.public} label="CÔNG KHAI" color="text-green-400" />
            </div>
          </div>

          {/* Filters */}
          <div className="px-4 pb-2 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <div className="flex bg-slate-800/50 p-1 rounded-xl">
              <FilterTab active={activeFilter === 'all'} onClick={() => setActiveFilter('all')}>
                Tất cả
              </FilterTab>
              <FilterTab active={activeFilter === 'public'} onClick={() => setActiveFilter('public')}>
                Công khai
              </FilterTab>
              <FilterTab active={activeFilter === 'private'} onClick={() => setActiveFilter('private')}>
                Riêng tư
              </FilterTab>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-8 w-[1px] bg-slate-800 mx-1" />
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className={`p-4 ${viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-4'}`}>
          {filteredHighlights.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera size={32} className="opacity-50" />
              </div>
              <p>Chưa có video nào</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => navigate('/self-recording')}
              >
                Quay video ngay
              </Button>
            </div>
          ) : (
            filteredHighlights.map((highlight) => (
              <VideoItem
                key={highlight.id}
                highlight={highlight}
                viewMode={viewMode}
                onClick={() => navigate(`/highlight/${highlight.id}`)}
              />
            ))
          )}
        </div>
      </div>
    </PageTransition>
  );
};

// --- Sub-components ---

const StatItem: React.FC<{ icon: React.ReactNode, value: number, label: string, color: string }> = ({ icon, value, label, color }) => (
  <div className="flex flex-col items-center">
    <div className="relative w-14 h-14 flex items-center justify-center mb-2">
      {/* Ring background */}
      <svg className="absolute inset-0 w-full h-full -rotate-90">
        <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
        <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={150} strokeDashoffset={150 - (150 * 0.7)} className={`${color} opacity-80`} strokeLinecap="round" />
      </svg>
      <div className="flex flex-col items-center z-10">
        <span className="text-xs opacity-70 mb-0.5">{icon}</span>
        <span className="text-sm font-bold text-white leading-none">{value}</span>
      </div>
    </div>
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
  </div>
);

const FilterTab: React.FC<{ active: boolean, onClick: () => void, children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${active ? 'bg-lime-400 text-slate-900 shadow-lg shadow-lime-400/20' : 'text-slate-400 hover:text-white'
      }`}
  >
    {children}
  </button>
);

const VideoItem: React.FC<{ highlight: Highlight, viewMode: 'grid' | 'list', onClick: () => void }> = ({ highlight, viewMode, onClick }) => (
  <motion.div
    layout
    onClick={onClick}
    className={`group relative overflow-hidden rounded-xl bg-slate-800 cursor-pointer border border-slate-700/50 ${viewMode === 'list' ? 'flex gap-4 p-3 h-28' : 'aspect-[9/16]'
      }`}
  >
    {/* Thumbnail */}
    <div className={`relative ${viewMode === 'list' ? 'w-20 h-full rounded-lg overflow-hidden flex-shrink-0' : 'w-full h-full'}`}>
      <img
        src={highlight.thumbnailUrl}
        alt={highlight.title}
        className="w-full h-full object-cover transition-transform group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

      {/* Duration Badge */}
      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur rounded text-[10px] font-mono text-white">
        00:{highlight.durationSec}
      </div>

      {/* Status Icon */}
      <div className="absolute top-2 right-2">
        {highlight.isPublic ? (
          <Globe size={14} className="text-lime-400 drop-shadow-md" />
        ) : (
          <Lock size={14} className="text-slate-400 drop-shadow-md" />
        )}
      </div>
    </div>

    {/* Info (List Mode) */}
    {viewMode === 'list' && (
      <div className="flex-1 flex flex-col justify-center">
        <h3 className="font-bold text-white text-sm line-clamp-2 mb-1">{highlight.title || 'Untitled Highlight'}</h3>
        <p className="text-xs text-slate-400 mb-2">{new Date(highlight.createdAt).toLocaleDateString()}</p>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Eye size={12} /> {highlight.views}</span>
          <span className="flex items-center gap-1"><Heart size={12} /> {highlight.likes}</span>
        </div>
      </div>
    )}

    {/* Overlay Info (Grid Mode) */}
    {viewMode === 'grid' && (
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="flex items-center gap-2 text-xs text-white/90 font-medium">
          <Play size={12} className="fill-white" />
          <span>{highlight.views}</span>
        </div>
      </div>
    )}
  </motion.div>
);
