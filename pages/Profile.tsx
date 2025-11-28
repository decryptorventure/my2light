import React, { useEffect, useState } from 'react';
import { Settings, LogOut, Clock, Zap, Map as MapIcon, Edit2, Calendar, CreditCard, ChevronDown, Camera, Wallet, Activity } from 'lucide-react';
import { PageTransition } from '../components/Layout/PageTransition';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { StatCircle } from '../components/ui/CircularProgress';
import { Stories } from '../components/ui/Stories';
import { Badges } from '../components/ui/Badges';
import { ApiService } from '../services/api';
import { User, Booking } from '../types';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';

export const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');

    // Edit States
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editBio, setEditBio] = useState('');
    const [isPublic, setIsPublic] = useState(true);

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
            setEditBio(res.data.bio || '');
            setIsPublic(res.data.isPublic ?? true);
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
        const res = await ApiService.updateUserProfile({
            name: editName,
            phone: editPhone,
            bio: editBio,
            is_public: isPublic
        });
        if (res.success) {
            setUser(prev => prev ? {
                ...prev,
                name: editName,
                phone: editPhone,
                bio: editBio,
                isPublic
            } : null);
            setIsEditOpen(false);
            showToast('Cập nhật hồ sơ thành công!', 'success');
        } else {
            showToast('Cập nhật thất bại', 'error');
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

    // Generate activity data from real bookings
    const generateActivityData = () => {
        const data: { date: string; count: number; duration: number }[] = [];
        const today = new Date();
        const map: Map<string, { count: number; duration: number }> = new Map();

        // Initialize last 84 days with 0
        for (let i = 0; i < 84; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            map.set(dateStr, { count: 0, duration: 0 });
        }

        // Fill with booking data
        bookings.forEach(b => {
            const dateStr = new Date(b.startTime).toISOString().split('T')[0];
            if (map.has(dateStr)) {
                const current = map.get(dateStr)!;
                const durationMinutes = (b.endTime - b.startTime) / 60000;
                map.set(dateStr, {
                    count: current.count + 1,
                    duration: current.duration + durationMinutes
                });
            }
        });

        // Convert map to array
        map.forEach((value: { count: number; duration: number }, key: string) => {
            if (value.count > 0) { // Only push active days to save space/rendering
                data.push({
                    date: key,
                    count: value.count,
                    duration: value.duration
                });
            }
        });

        return data;
    };

    if (loading) return <LoadingSpinner fullScreen />;
    if (!user) return null;

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
                <div className="flex flex-col items-center mb-6">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-700 mb-4 shadow-xl relative">
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                <Camera size={24} className="text-white" />
                            </div>
                        </div>
                        <div className="absolute bottom-4 right-0 w-6 h-6 bg-lime-400 rounded-full border-4 border-slate-900" />
                        <input
                            type="file"
                            id="avatar-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    // Simple loading state for avatar
                                    const oldAvatar = user.avatar;
                                    setUser(prev => prev ? { ...prev, avatar: 'https://media.tenor.com/On7kvXhzml4AAAAj/loading-gif.gif' } : null);

                                    const res = await ApiService.uploadAvatar(file);
                                    if (res.success) {
                                        setUser(prev => prev ? { ...prev, avatar: res.data } : null);
                                        // Also update profile in DB with new URL
                                        await ApiService.updateUserProfile({ avatar: res.data });
                                        showToast('Upload ảnh thành công!', 'success');
                                    } else {
                                        showToast('Upload thất bại!', 'error');
                                        setUser(prev => prev ? { ...prev, avatar: oldAvatar } : null);
                                    }
                                }
                            }}
                        />
                    </div>
                    <h2 className="text-2xl font-bold text-white text-center">{user.name}</h2>
                    <div className="flex items-center gap-2 mt-1 mb-2">
                        <span className="text-lime-400 font-bold text-xs uppercase tracking-wider bg-lime-400/10 px-2 py-1 rounded border border-lime-400/20">
                            {user.membershipTier} Member
                        </span>
                        <span className="text-slate-500 text-xs">{user.phone || 'Chưa có SĐT'}</span>
                    </div>

                    {user.bio && (
                        <p className="text-slate-400 text-sm text-center max-w-xs mb-4">
                            {user.bio}
                        </p>
                    )}

                    <div className="flex items-center gap-6 text-sm mb-2">
                        <button onClick={() => navigate('/social/connections?tab=followers')} className="flex flex-col items-center">
                            <span className="font-bold text-white text-lg">{user.followersCount || 0}</span>
                            <span className="text-slate-500 text-xs">Người theo dõi</span>
                        </button>
                        <button onClick={() => navigate('/social/connections?tab=following')} className="flex flex-col items-center">
                            <span className="font-bold text-white text-lg">{user.followingCount || 0}</span>
                            <span className="text-slate-500 text-xs">Đang theo dõi</span>
                        </button>
                    </div>
                </div>

                {/* Stories Section - New Creative Feature */}
                <div className="mb-6">
                    <Stories />
                </div>

                {/* Badges Section - Gamification */}
                <div className="mb-8">
                    <Badges />
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
                        <div className="grid grid-cols-3 gap-4">
                            <StatCircle
                                icon={<Zap size={20} />}
                                label="Highlight"
                                value={user.totalHighlights}
                                max={50}
                                color="warning"
                                size={100}
                            />
                            <StatCircle
                                icon={<Clock size={20} />}
                                label="Giờ chơi"
                                value={user.hoursPlayed}
                                max={100}
                                color="info"
                                size={100}
                            />
                            <StatCircle
                                icon={<MapIcon size={20} />}
                                label="Sân đã đến"
                                value={user.courtsVisited}
                                max={20}
                                color="success"
                                size={100}
                            />
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

                        {/* Role Management Section */}
                        {(user.role === 'court_owner' || user.role === 'both') && (
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pl-1">Quản lý sân</h3>
                                <Card className="p-5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <Activity size={20} className="text-blue-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-white">Dashboard Chủ Sân</h4>
                                            <p className="text-xs text-slate-400">Quản lý sân và booking</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => navigate('/admin/dashboard')}
                                        className="w-full bg-blue-500 hover:bg-blue-600"
                                    >
                                        Mở Dashboard
                                    </Button>
                                </Card>
                            </div>
                        )}

                        {/* Become Court Owner - Show if user is only player */}
                        {user.role === 'player' && (
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pl-1">Dành cho chủ sân</h3>
                                <Card className="p-5 bg-gradient-to-r from-lime-400/10 to-green-400/10 border-lime-400/30">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-lime-400/20 flex items-center justify-center">
                                            <Activity size={20} className="text-lime-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-white">Bạn là chủ sân?</h4>
                                            <p className="text-xs text-slate-400">Đăng ký ngay để quản lý sân</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => navigate('/become-court-owner')}
                                        variant="outline"
                                        className="w-full border-lime-400 text-lime-400 hover:bg-lime-400/10"
                                    >
                                        Đăng ký làm chủ sân
                                    </Button>
                                </Card>
                            </div>
                        )}

                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pl-1">Cài đặt</h3>
                            <div className="space-y-3">
                                <Button
                                    variant="secondary"
                                    className="w-full justify-between bg-slate-800/50 border-slate-700"
                                    onClick={() => navigate('/my-bookings')}
                                >
                                    <span>Lịch Đặt Sân</span>
                                    <Calendar size={16} className="text-slate-500" />
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="w-full justify-between bg-slate-800/50 border-slate-700"
                                    onClick={() => navigate('/wallet')}
                                >
                                    <span>Ví My2Light</span>
                                    <Wallet size={16} className="text-slate-500" />
                                </Button>
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
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${booking.status === 'completed' ? 'bg-green-500/20 text-green-500' :
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
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Giới thiệu (Bio)</label>
                            <textarea
                                value={editBio}
                                onChange={(e) => setEditBio(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-lime-400 h-24 resize-none"
                                placeholder="Viết gì đó về bạn..."
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-slate-400">Công khai hồ sơ</label>
                            <button
                                onClick={() => setIsPublic(!isPublic)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${isPublic ? 'bg-lime-400' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isPublic ? 'left-7' : 'left-1'}`} />
                            </button>
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
