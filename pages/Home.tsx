
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, MapPin, Activity, ChevronRight, Play, Camera, Mic } from 'lucide-react';
import { PageTransition } from '../components/Layout/PageTransition';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SkeletonCourtCard, SkeletonHighlightCard, Skeleton } from '../components/ui/Skeleton';
import { ApiService } from '../services/api';
import { User, Court, Highlight } from '../types';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Load user first to ensure auth context
        const userRes = await ApiService.getCurrentUser();
        console.log('🔍 DEBUG getCurrentUser result:', userRes);
        if (userRes.success) {
          console.log('✅ User loaded:', userRes.data);
          setUser(userRes.data);
        } else {
          console.error('❌ Failed to load user:', userRes.error);
        }

        // Load content
        const [courtsRes, highlightsRes] = await Promise.all([
          ApiService.getCourts(),
          ApiService.getHighlights(5)
        ]);

        if (courtsRes.success) setCourts(courtsRes.data);
        if (highlightsRes.success) setHighlights(highlightsRes.data);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Safe fallback if user load fails completely
  const displayUser = user || {
    name: 'Khách',
    credits: 0,
    avatar: 'https://cdn-icons-png.flaticon.com/512/3307/3307873.png'
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'live': return 'Đang diễn ra';
      case 'available': return 'Còn trống';
      case 'busy': return 'Hết sân';
      default: return status;
    }
  };

  return (
    <PageTransition>
      <div className="p-6 pt-8 pb-24 space-y-8 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-slate-400 text-sm mb-1">Chào mừng trở lại,</p>
            <h2 className="text-2xl font-bold">{displayUser.name}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              <span className="text-lime-400 font-bold text-xs">{displayUser.credits?.toLocaleString() || 0}đ</span>
            </div>
            <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-slate-700 cursor-pointer" onClick={() => navigate('/profile')}>
              <img src={displayUser.avatar} alt="Profile" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>

        {/* Hero Actions */}
        <div className="grid grid-cols-2 gap-4">
          {/* Scan QR */}
          <div
            onClick={() => navigate('/qr')}
            className="relative h-40 rounded-3xl overflow-hidden cursor-pointer group shadow-xl shadow-lime-900/20 bg-lime-500"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-br from-lime-400 to-lime-600 opacity-90 transition-opacity group-hover:opacity-100" />

            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-900 p-4 text-center z-10">
              <div className="w-12 h-12 bg-slate-900/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-2">
                <QrCode size={24} />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight leading-none">QUÉT QR<br />VÀO SÂN</h3>
            </div>
          </div>

          {/* AI Self Recording */}
          <div
            onClick={() => navigate('/self-recording')}
            className="relative h-40 rounded-3xl overflow-hidden cursor-pointer group shadow-xl shadow-blue-900/20 bg-blue-500"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 opacity-90 transition-opacity group-hover:opacity-100" />

            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center z-10">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-2 relative">
                <Camera size={24} />
                <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1">
                  <Mic size={10} className="text-white" />
                </div>
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight leading-none">TỰ QUAY<br />(AI VOICE)</h3>
            </div>
          </div>
        </div>

        {/* Recent Highlights */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Activity size={18} className="text-lime-400" />
              Highlight Gần Đây
            </h3>
            <span className="text-xs text-lime-400 font-semibold cursor-pointer" onClick={() => navigate('/gallery')}>Xem tất cả</span>
          </div>

          {loading ? (
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
              {[1, 2, 3].map(i => <SkeletonHighlightCard key={i} />)}
            </div>
          ) : highlights.length === 0 ? (
            <div className="text-center py-8 bg-slate-800/30 rounded-2xl border border-slate-800 border-dashed">
              <p className="text-slate-500 text-sm">Chưa có highlight nào. Hãy ra sân chơi nhé!</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
              {highlights.map((highlight) => (
                <Card
                  key={highlight.id}
                  className="min-w-[160px] h-[240px] relative group cursor-pointer flex-shrink-0"
                  onClick={() => navigate('/gallery')}
                >
                  <img src={highlight.thumbnailUrl} alt="Highlight" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                      <Play size={16} className="fill-white text-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="text-xs font-medium text-slate-300 block mb-1 truncate">{highlight.courtName}</span>
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold text-lg">00:{highlight.durationSec}</span>
                      <span className="text-xs bg-lime-400 text-slate-900 px-1.5 py-0.5 rounded font-bold">HD</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Nearby Courts */}
        <section className="pb-20">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <MapPin size={18} className="text-blue-500" />
              Sân Gần Bạn
            </h3>
          </div>

          <div className="space-y-4">
            {loading ? (
              <>
                {[1, 2, 3].map(i => <SkeletonCourtCard key={i} />)}
              </>
            ) : (
              courts.map((court) => (
                <Card key={court.id} className="flex p-3 gap-4 items-center group cursor-pointer" hoverEffect>
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800 relative">
                    <img src={court.thumbnailUrl} alt={court.name} className="w-full h-full object-cover" />
                    {court.status === 'live' && (
                      <div className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_red]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm leading-tight mb-1 group-hover:text-lime-400 transition-colors">{court.name}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${court.status === 'live' ? 'bg-red-500/20 text-red-500' :
                        court.status === 'available' ? 'bg-green-500/20 text-green-500' :
                          'bg-orange-500/20 text-orange-500'
                        }`}>
                        {getStatusLabel(court.status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2 line-clamp-1">{court.address}</p>
                    <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
                      <span>{court.distanceKm} km</span>
                      <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                      <span>{court.rating} ⭐</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="p-2 text-slate-500 group-hover:text-white">
                    <ChevronRight size={18} />
                  </Button>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>
    </PageTransition>
  );
};
