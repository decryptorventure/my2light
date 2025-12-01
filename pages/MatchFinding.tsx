import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Calendar, User, MapPin, Clock, Search, Trash2, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition } from '../components/Layout/PageTransition';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useToast } from '../components/ui/Toast';
import { courtsService } from '../src/api';
import { MatchRequest, Court } from '../types';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

export const MatchFinding: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { showToast } = useToast();
    const [requests, setRequests] = useState<MatchRequest[]>([]);
    const [courts, setCourts] = useState<Court[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Filter states
    const [filterLevel, setFilterLevel] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');

    useEffect(() => {
        fetchRequests();
        fetchCourts();
    }, [filterLevel, filterType]);

    const fetchCourts = async () => {
        const res = await courtsService.getCourts();
        if (res.success) {
            setCourts(res.data);
        }
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('match_requests')
                .select('*, profiles(*)')
                .eq('status', 'open')
                .order('created_at', { ascending: false });

            if (filterLevel !== 'all') {
                query = query.eq('skill_level', filterLevel);
            }
            if (filterType !== 'all') {
                query = query.eq('match_type', filterType);
            }

            const { data, error } = await query;

            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error('Error fetching match requests:', error);
            showToast('Không thể tải danh sách kèo', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRequest = async (formData: any) => {
        try {
            const { error } = await supabase
                .from('match_requests')
                .insert([{
                    user_id: user?.id,
                    ...formData,
                    status: 'open'
                }]);

            if (error) throw error;

            showToast('Đã tạo kèo thành công!', 'success');
            setShowCreateModal(false);
            fetchRequests(); // Refresh list immediately
        } catch (error) {
            console.error('Error creating request:', error);
            showToast('Lỗi khi tạo kèo', 'error');
        }
    };

    const handleUpdateStatus = async (id: string, status: 'matched' | 'cancelled') => {
        try {
            const { error } = await supabase
                .from('match_requests')
                .update({ status })
                .eq('id', id);

            if (error) throw error;

            showToast(status === 'matched' ? 'Đã chốt kèo thành công!' : 'Đã hủy kèo', 'success');
            fetchRequests();
        } catch (error) {
            console.error('Error updating status:', error);
            showToast('Có lỗi xảy ra', 'error');
        }
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-slate-900 pb-24">
                {/* Header - Adjusted spacing */}
                <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 pb-3 pt-safe-top mt-2">
                    <div className="flex justify-between items-center mb-4 pt-2">
                        <div>
                            <h1 className="text-2xl font-black text-white">Tìm Đối Thủ</h1>
                            <p className="text-xs text-slate-400">Cáp kèo Pickleball nhanh chóng</p>
                        </div>
                        <Button
                            size="sm"
                            variant="primary"
                            icon={<Plus size={16} />}
                            onClick={() => setShowCreateModal(true)}
                        >
                            Tạo kèo
                        </Button>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        <select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                            className="bg-slate-800 text-white text-xs rounded-full px-3 py-1.5 border border-slate-700 focus:border-lime-400 outline-none"
                        >
                            <option value="all">Tất cả trình độ</option>
                            <option value="beginner">Newbie</option>
                            <option value="intermediate">Trung bình</option>
                            <option value="advanced">Khá</option>
                            <option value="pro">Pro</option>
                        </select>

                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-slate-800 text-white text-xs rounded-full px-3 py-1.5 border border-slate-700 focus:border-lime-400 outline-none"
                        >
                            <option value="all">Tất cả thể loại</option>
                            <option value="singles">Đánh đơn</option>
                            <option value="doubles">Đánh đôi</option>
                        </select>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {loading ? (
                        <LoadingSpinner />
                    ) : requests.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="text-slate-500" size={24} />
                            </div>
                            <h3 className="text-white font-bold mb-2">Chưa có kèo nào</h3>
                            <p className="text-slate-400 text-sm mb-6">Hãy là người đầu tiên tạo kèo!</p>
                            <div className="flex justify-center">
                                <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                                    Tạo kèo mới
                                </Button>
                            </div>
                        </div>
                    ) : (
                        requests.map((req) => {
                            const isOwner = user?.id === req.user_id;
                            const courtName = courts.find(c => c.id === req.court_id)?.name || 'Sân tự do';

                            return (
                                <Card
                                    key={req.id}
                                    className={`p-4 border transition-colors ${isOwner
                                        ? 'bg-slate-800/80 border-lime-400/50 shadow-[0_0_15px_rgba(163,230,53,0.1)]'
                                        : 'bg-slate-800/50 border-slate-700 hover:border-lime-400/30'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border border-slate-600">
                                                {req.profiles?.avatar_url ? (
                                                    <img src={req.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                        <User size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-white text-sm">{req.profiles?.full_name || 'Người chơi ẩn danh'}</h3>
                                                    {isOwner && <span className="text-[10px] bg-lime-400 text-slate-900 px-1.5 rounded font-bold">Tôi</span>}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${req.skill_level === 'beginner' ? 'bg-green-500/20 text-green-400' :
                                                        req.skill_level === 'intermediate' ? 'bg-blue-500/20 text-blue-400' :
                                                            req.skill_level === 'advanced' ? 'bg-orange-500/20 text-orange-400' :
                                                                'bg-purple-500/20 text-purple-400'
                                                        }`}>
                                                        {req.skill_level}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">•</span>
                                                    <span className="text-[10px] text-slate-400 uppercase">
                                                        {req.match_type === 'singles' ? 'Đánh đơn' : req.match_type === 'doubles' ? 'Đánh đôi' : 'Tùy chọn'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {isOwner ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleUpdateStatus(req.id, 'cancelled')}
                                                    className="p-2 rounded-full bg-slate-700 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                                    title="Hủy kèo"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(req.id, 'matched')}
                                                    className="p-2 rounded-full bg-lime-400/10 text-lime-400 hover:bg-lime-400 hover:text-slate-900 transition-colors"
                                                    title="Đã chốt kèo"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <Button size="xs" variant="primary">Nhận kèo</Button>
                                        )}
                                    </div>

                                    <div className="space-y-2 text-sm text-slate-300 mb-3 bg-slate-900/50 p-3 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-500" />
                                            <span className="font-medium text-white">
                                                {new Date(req.preferred_time).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin size={14} className="text-slate-500" />
                                            <span>{courtName}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-slate-500" />
                                            <span>Giới tính: {req.gender === 'male' ? 'Nam' : req.gender === 'female' ? 'Nữ' : req.gender === 'mixed' ? 'Nam/Nữ' : 'Bất kỳ'}</span>
                                        </div>
                                        {req.description && (
                                            <div className="pt-1 border-t border-slate-700/50 mt-1">
                                                <p className="text-slate-400 italic text-xs">"{req.description}"</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>

                {/* Create Modal */}
                <AnimatePresence>
                    {showCreateModal && (
                        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                className="w-full max-w-md bg-slate-900 rounded-t-2xl sm:rounded-2xl border border-slate-800 p-6 space-y-6 max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-center sticky top-0 bg-slate-900 z-10 pb-2 border-b border-slate-800">
                                    <h2 className="text-xl font-bold text-white">Tạo kèo mới</h2>
                                    <button onClick={() => setShowCreateModal(false)} className="p-2 -mr-2 text-slate-400 hover:text-white">
                                        <X size={24} />
                                    </button>
                                </div>

                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    handleCreateRequest({
                                        skill_level: formData.get('skill_level'),
                                        match_type: formData.get('match_type'),
                                        gender: formData.get('gender'),
                                        court_id: formData.get('court_id') === 'any' ? null : formData.get('court_id'),
                                        preferred_time: formData.get('preferred_time'),
                                        description: formData.get('description'),
                                    });
                                }} className="space-y-4">

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Trình độ</label>
                                            <select name="skill_level" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-lime-400">
                                                <option value="beginner">Newbie</option>
                                                <option value="intermediate">Trung bình</option>
                                                <option value="advanced">Khá</option>
                                                <option value="pro">Pro</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Thể loại</label>
                                            <select name="match_type" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-lime-400">
                                                <option value="singles">Đánh đơn</option>
                                                <option value="doubles">Đánh đôi</option>
                                                <option value="any">Tùy chọn</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Giới tính</label>
                                            <select name="gender" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-lime-400">
                                                <option value="any">Bất kỳ</option>
                                                <option value="male">Nam</option>
                                                <option value="female">Nữ</option>
                                                <option value="mixed">Nam/Nữ</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Sân đấu</label>
                                            <select name="court_id" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-lime-400">
                                                <option value="any">Tự do / Chưa có sân</option>
                                                {courts.map(court => (
                                                    <option key={court.id} value={court.id}>{court.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Thời gian mong muốn</label>
                                        <input
                                            type="datetime-local"
                                            name="preferred_time"
                                            required
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-lime-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ghi chú thêm</label>
                                        <textarea
                                            name="description"
                                            rows={3}
                                            placeholder="Ví dụ: Cần tìm người giao lưu vui vẻ..."
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-lime-400"
                                        />
                                    </div>

                                    <div className="pt-4 pb-10">
                                        <Button type="submit" variant="primary" size="lg" className="w-full shadow-lg shadow-lime-400/20">
                                            Đăng tin tìm kèo
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </PageTransition>
    );
};
