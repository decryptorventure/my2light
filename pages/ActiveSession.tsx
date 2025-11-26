
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StopCircle, Zap, Check, Wifi, Mail, Download, Video, Users, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
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
  const [showEndModal, setShowEndModal] = useState(false);
  const [downloadStep, setDownloadStep] = useState<'choice' | 'downloading' | 'done'>('choice');
  
  // New UI states inspired by competitor
  const [sessionType, setSessionType] = useState<'rally' | 'match'>('match');

  useEffect(() => {
    const initSession = async () => {
        setLoading(true);
        const res = await ApiService.getActiveBooking();
        
        if (res.success && res.data) {
            setBooking(res.data);
            // Default to match for Full Match packages
            if (res.data.packageType === 'full_match') setSessionType('match');
        } else {
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
        // Prompt user
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

    // Vibration Feedback (Haptic)
    if (navigator.vibrate) {
        navigator.vibrate(200);
    }

    // Optimistic UI update
    setHighlightCount(prev => prev + 1);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);

    // Background API call
    try {
        await ApiService.createHighlight(booking.courtId);
    } catch (e) {
        console.error("Error creating highlight", e);
    }
  };

  const handleEndSessionClick = () => {
      if (booking?.packageType === 'full_match') {
          setDownloadStep('choice');
          setShowEndModal(true);
      } else {
          confirmEndSession();
      }
  };

  const confirmEndSession = async () => {
    await ApiService.endBooking();
    navigate('/home');
  };

  const handleWifiDownload = async () => {
      setDownloadStep('downloading');
      setTimeout(() => {
          setDownloadStep('done');
      }, 3000);
  };

  const handleEmailRequest = async () => {
      alert("Hệ thống sẽ gửi link tải video qua email cho bạn sau 2 giờ.");
      confirmEndSession();
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col relative overflow-hidden">
        {/* Ambient pulse background */}
        <div className={`absolute inset-0 animate-pulse ${booking?.packageType === 'full_match' ? 'bg-red-900/10' : 'bg-lime-400/5'}`} />

        {/* Header info with Session Type Toggle */}
        <div className="p-6 pt-8 flex justify-between items-start z-10">
            <div>
                <div className="flex bg-slate-800 rounded-lg p-0.5 mb-2 border border-slate-700 w-fit">
                    <button 
                        onClick={() => setSessionType('rally')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-colors ${sessionType === 'rally' ? 'bg-lime-400 text-slate-900' : 'text-slate-400'}`}
                    >
                        Rally
                    </button>
                    <button 
                        onClick={() => setSessionType('match')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-colors ${sessionType === 'match' ? 'bg-lime-400 text-slate-900' : 'text-slate-400'}`}
                    >
                        Match
                    </button>
                </div>
                <p className="text-white font-medium text-sm">Camera 01 • Sân Pickleball</p>
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
        <div className="p-6 pb-12 z-10 flex flex-col items-center gap-8">
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

            <div className="w-full flex flex-col gap-3">
                {/* Full Match Download Trigger - Explicit Request */}
                {booking?.packageType === 'full_match' && (
                     <Button 
                        variant="secondary"
                        onClick={() => {
                            setDownloadStep('choice');
                            setShowEndModal(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700"
                     >
                         <Video size={16} />
                         <span>Tải video cả trận</span>
                     </Button>
                )}

                <div className="w-full flex justify-between items-center px-4 bg-slate-800/50 rounded-2xl p-4 backdrop-blur-md border border-white/5">
                     <div className="text-center">
                        <span className="block text-2xl font-bold text-white">{highlightCount}</span>
                        <span className="text-xs text-slate-400">Clip đã lưu</span>
                     </div>

                     <Button variant="secondary" size="sm" onClick={handleEndSessionClick} className="flex items-center gap-2 bg-slate-700/50 border-slate-600 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50">
                        <StopCircle size={16} />
                        Kết thúc
                     </Button>
                </div>
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

        {/* Full Match End Game Modal */}
        <Modal
            isOpen={showEndModal}
            onClose={() => setShowEndModal(false)}
            title="Tải Video Trận Đấu"
        >
            {downloadStep === 'choice' && (
                <div className="space-y-4">
                    <p className="text-sm text-slate-300">
                        Gói <b>Quay Cả Trận</b> của bạn đã được lưu. Chọn phương thức tải video (1.5GB):
                    </p>
                    
                    <div onClick={handleWifiDownload} className="bg-slate-700/50 p-4 rounded-xl border border-lime-400/30 cursor-pointer hover:bg-slate-700 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-lime-400/20 p-2 rounded-lg">
                                <Wifi size={24} className="text-lime-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white">Wifi Nội Bộ Box (Siêu tốc)</h4>
                                <span className="text-xs text-lime-400">Tải ngay tại sân • Miễn phí Data</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400">Kết nối vào Wifi "my2light_Box_01" và tải video trực tiếp.</p>
                    </div>

                    <div onClick={handleEmailRequest} className="bg-slate-700/50 p-4 rounded-xl border border-white/5 cursor-pointer hover:bg-slate-700 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-blue-500/20 p-2 rounded-lg">
                                <Mail size={24} className="text-blue-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white">Gửi link qua Email</h4>
                                <span className="text-xs text-blue-400">Nhận sau 2-4 giờ</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400">Hệ thống sẽ nén video và gửi link tải qua email đăng ký.</p>
                    </div>
                </div>
            )}

            {downloadStep === 'downloading' && (
                <div className="text-center py-8">
                    <LoadingSpinner size="lg" />
                    <h4 className="text-white font-bold mt-4">Đang kết nối Box...</h4>
                    <p className="text-slate-400 text-sm mt-2">Đừng tắt màn hình nhé!</p>
                    <div className="w-full bg-slate-700 h-2 rounded-full mt-6 overflow-hidden">
                        <motion.div 
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 3 }}
                            className="h-full bg-lime-400"
                        />
                    </div>
                </div>
            )}

            {downloadStep === 'done' && (
                <div className="text-center py-6">
                    <div className="w-16 h-16 bg-lime-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check size={32} className="text-slate-900" />
                    </div>
                    <h4 className="text-white font-bold text-xl">Đã lưu vào Album!</h4>
                    <p className="text-slate-400 text-sm mt-2 mb-6">Video cả trận đã nằm trong máy bạn.</p>
                    <Button onClick={confirmEndSession}>Về trang chủ</Button>
                </div>
            )}
        </Modal>
    </div>
  );
};
