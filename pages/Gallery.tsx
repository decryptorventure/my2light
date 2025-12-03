import React, { useState, useEffect, useRef } from 'react';
import {
  Heart, Share2, Download, MessageCircle, ChevronLeft,
  Eye, TrendingUp, Users, Bookmark, MoreVertical, X, List, Play, Zap
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/Layout/PageTransition';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { highlightsService } from '../src/api';
import { SocialService } from '../services/social';
import { Highlight } from '../types';
import { celebrate } from '../lib/confetti';
import { CommentSection } from '../components/social/CommentSection';
import { useToast } from '../components/ui/Toast';
import { LikeAnimation } from '../components/ui/LikeAnimation';
import { useHighlights } from '../hooks/useApi';

import { VideoFeedItem } from '../src/components/video/VideoFeedItem';

export const Gallery: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'all' | 'mine' | 'trending' | 'friends'>('all');

  // React Query - automatic caching, refetching, loading states!
  const { data: highlights = [], isLoading: loading } = useHighlights(20);

  const filters = [
    { id: 'all', label: 'Tất cả', icon: Eye },
    { id: 'mine', label: 'Của tôi', icon: Bookmark },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'friends', label: 'Bạn bè', icon: Users }
  ];

  // Intersection Observer to track active video
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveVideoId(entry.target.getAttribute('data-id'));
          }
        });
      },
      { threshold: 0.6 }
    );

    return () => observer.current?.disconnect();
  }, []);

  // Observe elements when highlights change
  useEffect(() => {
    const elements = document.querySelectorAll('.video-card');
    elements.forEach(el => observer.current?.observe(el));
  }, [highlights]);

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
        <div className="h-screen overflow-y-scroll snap-y snap-mandatory no-scrollbar pt-0 pb-0">
          {highlights.length === 0 ? (
            <div className="flex h-full items-center justify-center text-slate-500">
              Chưa có highlight nào
            </div>
          ) : (
            highlights.map((highlight) => (
              <div
                key={highlight.id}
                data-id={highlight.id}
                className="video-card h-screen snap-start w-full"
              >
                <VideoFeedItem
                  highlight={highlight}
                  isActive={activeVideoId === highlight.id}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </PageTransition>
  );
};
