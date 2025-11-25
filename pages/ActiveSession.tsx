
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StopCircle, Zap, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ApiService } from '../services/api';
import { Booking } from '../types';

export const ActiveSession: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const [highlightCount, setHighlightCount] = useState(0);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const initSession = async () => {
        setLoading(true);
        const res = await ApiService.getActiveBooking();
        
        if (res.success && res.data) {
            setBooking(res.data);
        } else {
            // No active booking found, redirect home
            console.log("No active booking");
            navigate('/home');
        }
        setLoading(false);
    };
    initSession();
  }, [navigate]);

  useEffect(() => {
    if (!booking) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = booking.endTime - now;
      
      if (diff <= 0) {
        clearInterval(interval);
        handleEndSession();
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [booking]);

  const handleMarkHighlight = async () => {
    if (!booking) return;

    // Optimistic UI update (feedback immediate)
    setHighlightCount(prev => prev + 1);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);

    // Background API call
    try {
        await ApiService.createHighlight(booking.courtId);
        console.log("Highlight created via API");
    } catch (e) {
        console.error("Error creating highlight", e);
        // In real app, revert count or show error
    }
  };

  const handleEndSession = async () => {
    await ApiService.endBooking();
    navigate('/home');
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col relative overflow-hidden">
        {/* Ambient pulse background */}
        <div className="absolute inset-0 bg-lime-400/5 animate-pulse" />

        {/* Header info */}
        <div className="p-6 pt-8 flex justify-between items-start z-10">
            <div>
                <h1 className="text-lime-400 font-bold tracking-wider uppercase text-sm">ĐANG DIỄN RA</h1>
                <p className="text-white font-medium">Sân Pickleball • Camera 01</p>
            </div>
            <div className="bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-slate-300 text-xs font-mono">REC</span>
            </div>
        </div>

        {/* Timer */}
        <div className="flex-1 flex flex-col items-center justify-center z-10">
            <div className="text-7xl font-black text-white tracking-tighter tabular-nums mb-2 drop-shadow-2xl">
                {timeLeft}
            </div>
            <p className="text-slate-400 text-sm font-medium bg-slate-900/50 px-3 py-1 rounded-full">Thời gian còn lại</p>
        </div>

        {/* Controls */}
        <div className="p-6 pb-12 z-10 flex flex-col items-center gap-10">
            <div className="relative">
                {/* Highlight Button */}
                <motion.button
                    onClick={handleMarkHighlight}
                    whileTap={{ scale: 0.9 }}
                    className="w-48 h-48 rounded-full bg-gradient-to-b from-orange-400 to-red-500 shadow-[0_0_60px_rgba(249,115,22,0.5)] flex flex-col items-center justify-center border-8 border-slate-900 relative z-20 group"
                >
                    <Zap size={48} className="text-white fill-white mb-2 group-active:scale-125 transition-transform duration-200" />
                    <span className="text-white font-black text-lg uppercase tracking-wider text-center leading-tight">LƯU<br/>HIGHLIGHT</span>
                </motion.button>
                
                {/* Ripple Effect Ring */}
                <div className="absolute inset-0 rounded-full border border-orange-500/30 scale-150 animate-ping z-0 pointer-events-none" />
            </div>

            <div className="w-full flex justify-between items-center px-4 bg-slate-800/50 rounded-2xl p-4 backdrop-blur-md border border-white/5">
                 <div className="text-center">
                    <span className="block text-2xl font-bold text-white">{highlightCount}</span>
                    <span className="text-xs text-slate-400">Clip đã lưu</span>
                 </div>

                 <Button variant="secondary" size="sm" onClick={handleEndSession} className="flex items-center gap-2 bg-slate-700/50 border-slate-600 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50">
                    <StopCircle size={16} />
                    Kết thúc
                 </Button>
            </div>
        </div>

        {/* Success Toast */}
        <AnimatePresence>
            {showToast && (
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    className="absolute bottom-40 left-1/2 -translate-x-1/2 bg-slate-800/95 backdrop-blur-xl text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl border border-lime-400/30 z-50 whitespace-nowrap"
                >
                    <div className="bg-lime-400 rounded-full p-1">
                        <Check size={12} className="text-slate-900 stroke-[4]" />
                    </div>
                    <span className="font-bold text-sm">Đã lưu Highlight! (-30s)</span>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};
