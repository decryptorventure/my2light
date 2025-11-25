
import React, { useEffect, useState } from 'react';
import { Settings, LogOut, Clock, Zap, Map, Edit2, Calendar, CreditCard, ChevronDown } from 'lucide-react';
import { PageTransition } from '../components/Layout/PageTransition';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ApiService } from '../services/api';
import { User, Booking } from '../types';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');
  
  // Edit States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const res = await ApiService.getCurrentUser();
    if (res.success) {
        setUser(res.data);
        setEditName(res.data.name);
        setEditPhone(res.data.phone);
    }
    
    // Load history
    const historyRes = await ApiService.getBookingHistory();
    if (historyRes.success) setBookings(historyRes.data);

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleSaveProfile = async () => {
      const res = await ApiService.updateUserProfile({ name: editName, phone: editPhone });
      if (res.success) {
          setUser(prev => prev ? { ...prev, name: editName, phone: editPhone } : null);
          setIsEditOpen(false);
      }
  };

  const handleTopUp = async () => {
      // Simulation for MVP
      const amount = 100000;
      if (!user) return;
      const res = await ApiService.updateUserProfile({ credits: user.credits + amount });
      if (res.success) {
          setUser(prev => prev ? { ...prev, credits: prev.credits + amount } : null);
          alert(`Đã nạp thành công ${amount.toLocaleString()}đ vào ví!`);
      }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return null;

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <Card className="p-3 flex flex-col items-center justify-center text-center gap-2 bg-slate-800/50">
      <div className={`p-2 rounded-full ${color} bg-opacity-20`}>
        <Icon size={18} className={color.replace('bg-', 'text-')} />
      </div>
      <div>
        <div className="text-lg font-black text-white">{value}</div>
        <div className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</div>
      </div>
    </Card>
  );

  return (
    <PageTransition>
      <div className="p-6 pt-8 pb-24">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Hồ sơ</h1>
            <Button variant="ghost" size="sm" className="p-2" onClick={() => setIsEditOpen(true)}>
                <Edit2 size={20} />
            </Button>
        </div>

        {/* User Info Header */}
        <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-700 mb-4 shadow-xl relative">
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-lime-400 rounded-full border-4 border-slate-900" />
            </div>
            <h2 className="text-2xl font-bold text-white text-center">{user.name}</h2>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-lime-400 font-bold text-xs uppercase tracking-wider bg-lime-400/10 px-2 py-1 rounded border border-lime-400/20">
                    {user.membershipTier} Member
                </span>
                <span className="text-slate-500 text-xs">{user.phone || 'Chưa có SĐT'}</span>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-slate-800 rounded-xl mb-6">
            <button 
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'info' ? 'bg-slate-700 text-white shadow' : 'text-slate-400'}`}
            >
                Thông tin
            </button>
            <button 
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-slate-700 text-white shadow' : 'text-slate-400'}`}
            >
                Lịch sử đấu
            </button>
        </div>

        {activeTab === 'info' ? (
            <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
                <div className="grid grid-cols-3 gap-3">
                    <StatCard icon={Zap} label="Highlight" value={user.totalHighlights} color="bg-yellow-500" />
                    <StatCard icon={Clock} label="Giờ chơi" value={user.hoursPlayed} color="bg-blue-500" />
                    <StatCard icon={Map} label="Sân đã đến" value={user.courtsVisited} color="bg-purple-500" />
                </div>

                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pl-1">Ví của tôi</h3>
                    <Card className="p-0 overflow-hidden bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700">
                        <div className="p-5 flex justify-between items-center">
                            <div>
                                <p className="text-slate-400 text-xs mb-1">Số dư khả dụng</p>
                                <span className="font-black text-2xl text-lime-400">{user.credits.toLocaleString()}đ</span>
                            </div>
                            <Button size="sm" onClick={handleTopUp} className="bg-lime-400 text-slate-900 hover:bg-lime-300 font-bold">
                                Nạp thêm
                            </Button>
                        </div>
                    </Card>
                </div>

                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pl-1">Cài đặt</h3>
                    <div className="space-y-3">
                        <Button variant="secondary" className="w-full justify-between bg-slate-800/50 border-slate-700">
                            <span>Liên kết ngân hàng</span>
                            <CreditCard size={16} className="text-slate-500" />
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
            </div>
        ) : (
            <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                {bookings.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Chưa có lịch sử đặt sân nào.</p>
                    </div>
                ) : (
                    bookings.map(booking => (
                        <Card key={booking.id} className="p-4 flex gap-4 bg-slate-800/50 border-slate-700">
                            <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0 font-bold text-slate-400 text-xs flex-col">
                                <span>{new Date(booking.startTime).getDate()}</span>
                                <span className="uppercase">{new Date(booking.startTime).toLocaleString('en-US', { month: 'short' })}</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-white text-sm">{booking.courtName}</h4>
                                <p className="text-xs text-slate-400 mb-1">{booking.packageName}</p>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                        booking.status === 'completed' ? 'bg-green-500/20 text-green-500' : 
                                        booking.status === 'active' ? 'bg-blue-500/20 text-blue-500' : 'bg-slate-600 text-slate-300'
                                    }`}>
                                        {booking.status}
                                    </span>
                                    <span className="text-xs font-medium text-slate-300">
                                        -{booking.totalAmount.toLocaleString()}đ
                                    </span>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        )}

        {/* Edit Profile Modal */}
        <Modal 
            isOpen={isEditOpen} 
            onClose={() => setIsEditOpen(false)}
            title="Chỉnh sửa thông tin"
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Tên hiển thị</label>
                    <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-lime-400"
                    />
                </div>
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Số điện thoại</label>
                    <input 
                        type="tel" 
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-lime-400"
                    />
                </div>
                <Button onClick={handleSaveProfile} className="w-full mt-4">Lưu thay đổi</Button>
            </div>
        </Modal>

        <p className="text-center text-[10px] text-slate-600 mt-6">
            Phiên bản MVP 1.0.1 (Auto-Fallback)
        </p>
      </div>
    </PageTransition>
  );
};
