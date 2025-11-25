
import React, { useEffect, useState } from 'react';
import { Settings, LogOut, Clock, Zap, Map } from 'lucide-react';
import { PageTransition } from '../components/Layout/PageTransition';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ApiService } from '../services/api';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
        setLoading(true);
        const res = await ApiService.getCurrentUser();
        if (res.success) setUser(res.data);
        setLoading(false);
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return null;

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <Card className="p-4 flex flex-col items-center justify-center text-center gap-2 bg-slate-800/50">
      <div className={`p-2 rounded-full ${color} bg-opacity-20`}>
        <Icon size={20} className={color.replace('bg-', 'text-')} />
      </div>
      <div>
        <div className="text-xl font-black text-white">{value}</div>
        <div className="text-xs text-slate-400">{label}</div>
      </div>
    </Card>
  );

  return (
    <PageTransition>
      <div className="p-6 pt-8 pb-24">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Hồ sơ</h1>
            <Button variant="ghost" size="sm" className="p-2">
                <Settings size={20} />
            </Button>
        </div>

        <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-700 mb-4 shadow-xl relative">
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-lime-400 rounded-full border-4 border-slate-900" />
            </div>
            <h2 className="text-2xl font-bold text-white">{user.name}</h2>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-lime-400 font-bold text-xs uppercase tracking-wider bg-lime-400/10 px-2 py-1 rounded border border-lime-400/20">
                    {user.membershipTier} Member
                </span>
                <span className="text-slate-500 text-xs">{user.phone || 'SĐT chưa cập nhật'}</span>
            </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
            <StatCard icon={Zap} label="Highlight" value={user.totalHighlights} color="bg-yellow-500" />
            <StatCard icon={Clock} label="Giờ chơi" value={user.hoursPlayed} color="bg-blue-500" />
            <StatCard icon={Map} label="Sân đã đến" value={user.courtsVisited} color="bg-purple-500" />
        </div>

        <div className="space-y-6">
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pl-1">Ví của tôi</h3>
                <Card className="p-0 overflow-hidden bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700">
                    <div className="p-5 flex justify-between items-center">
                        <div>
                            <p className="text-slate-400 text-xs mb-1">Số dư khả dụng</p>
                            <span className="font-black text-2xl text-lime-400">{user.credits.toLocaleString()}đ</span>
                        </div>
                        <Button size="sm" className="bg-lime-400 text-slate-900 hover:bg-lime-300 font-bold">
                            Nạp thêm
                        </Button>
                    </div>
                </Card>
            </div>

            <div>
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pl-1">Cài đặt</h3>
                 <div className="space-y-3">
                    <Button variant="secondary" className="w-full justify-between bg-slate-800/50 border-slate-700">
                        <span>Lịch sử đặt sân</span>
                        <Settings size={16} className="text-slate-500" />
                    </Button>
                    <Button variant="secondary" className="w-full justify-between bg-slate-800/50 border-slate-700">
                        <span>Liên kết ngân hàng</span>
                        <Settings size={16} className="text-slate-500" />
                    </Button>
                 </div>
            </div>

            <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-400 hover:bg-red-500/10"
            >
                <LogOut size={18} />
                Đăng xuất
            </Button>
            
            <p className="text-center text-[10px] text-slate-600">
                Phiên bản MVP 1.0.0 (Connected)
            </p>
        </div>
      </div>
    </PageTransition>
  );
};
