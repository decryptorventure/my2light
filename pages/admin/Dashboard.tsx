import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { AdminService } from '../../services/admin';
import { AdminStats } from '../../types/admin';
import { Building2, Calendar, DollarSign, TrendingUp } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        const res = await AdminService.getStats();
        if (res.success) {
            setStats(res.data);
        }
        setLoading(false);
    };

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
                <p className="text-slate-400">Tổng quan hoạt động sân của bạn</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Building2 size={20} className="text-blue-400" />
                        </div>
                        <span className="text-xs text-green-400">+2 tháng này</span>
                    </div>
                    <p className="text-sm text-slate-400 mb-1">Tổng sân</p>
                    <p className="text-2xl font-bold text-white">{stats?.totalCourts || 0}</p>
                </Card>

                <Card className="p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-lime-500/20 flex items-center justify-center">
                            <Calendar size={20} className="text-lime-400" />
                        </div>
                        <span className="text-xs text-green-400">+15%</span>
                    </div>
                    <p className="text-sm text-slate-400 mb-1">Lượt đặt tháng</p>
                    <p className="text-2xl font-bold text-white">{stats?.totalBookings || 0}</p>
                </Card>

                <Card className="p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                            <DollarSign size={20} className="text-yellow-400" />
                        </div>
                        <span className="text-xs text-green-400">+23%</span>
                    </div>
                    <p className="text-sm text-slate-400 mb-1">Doanh thu tháng</p>
                    <p className="text-2xl font-bold text-white">{(stats?.monthlyRevenue || 0).toLocaleString()}đ</p>
                </Card>

                <Card className="p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <TrendingUp size={20} className="text-purple-400" />
                        </div>
                        <span className="text-xs text-green-400">Tốt</span>
                    </div>
                    <p className="text-sm text-slate-400 mb-1">Tỷ lệ lấp đầy</p>
                    <p className="text-2xl font-bold text-white">{stats?.occupancyRate || 0}%</p>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card className="p-5">
                <h3 className="font-bold text-white mb-4">Thao tác nhanh</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button className="p-4 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-left">
                        <Building2 size={20} className="text-lime-400 mb-2" />
                        <p className="text-sm font-semibold text-white">Thêm sân mới</p>
                    </button>
                    <button className="p-4 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-left">
                        <Calendar size={20} className="text-blue-400 mb-2" />
                        <p className="text-sm font-semibold text-white">Xem booking</p>
                    </button>
                    <button className="p-4 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-left">
                        <DollarSign size={20} className="text-yellow-400 mb-2" />
                        <p className="text-sm font-semibold text-white">Báo cáo</p>
                    </button>
                    <button className="p-4 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-left">
                        <TrendingUp size={20} className="text-purple-400 mb-2" />
                        <p className="text-sm font-semibold text-white">Thống kê</p>
                    </button>
                </div>
            </Card>

            {/* Welcome Message */}
            <Card className="p-5 bg-gradient-to-r from-lime-400/10 to-green-400/10 border-lime-400/30">
                <h3 className="font-bold text-white mb-2">Chào mừng đến với my2light! 🎉</h3>
                <p className="text-sm text-slate-300 mb-4">
                    Đây là dashboard quản lý sân của bạn. Bắt đầu bằng cách thêm sân đầu tiên hoặc khám phá các tính năng.
                </p>
                <button className="px-4 py-2 bg-lime-400 text-slate-900 rounded-lg font-semibold hover:bg-lime-300 transition-colors">
                    Hướng dẫn sử dụng
                </button>
            </Card>
        </div>
    );
};
