import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { AdminService } from '../../services/admin';
import { AnalyticsService } from '../../services/analytics';
import { AdminStats } from '../../types/admin';
import { Building2, Calendar, DollarSign, TrendingUp, Plus, Users, FileText, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Import new analytics components
import { RevenueChart } from '../../components/admin/analytics/RevenueChart';
import { PeakHoursHeatmap } from '../../components/admin/analytics/PeakHoursHeatmap';
import { SmartRecommendations } from '../../components/admin/analytics/SmartRecommendations';
import { CustomerPredictions } from '../../components/admin/analytics/CustomerPredictions';
import { CustomerInsights } from '../../components/admin/analytics/CustomerInsights';
import { CourtPerformance } from '../../components/admin/analytics/CourtPerformance';

import type {
    RevenueDataPoint,
    PeakHoursData,
    PeakHoursInsight,
    SmartRecommendation,
    CustomerPrediction,
    CustomerInsight,
} from '../../types/social';

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    // Analytics state
    const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
    const [revenueGroupBy, setRevenueGroupBy] = useState<'day' | 'week' | 'month'>('day');
    const [peakHoursData, setPeakHoursData] = useState<{
        data: PeakHoursData[];
        insights: PeakHoursInsight;
    }>({ data: [], insights: {} as any });
    const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
    const [predictions, setPredictions] = useState<CustomerPrediction[]>([]);
    const [customerInsights, setCustomerInsights] = useState<CustomerInsight | null>(null);
    const [courtPerformance, setCourtPerformance] = useState<any[]>([]);

    const [analyticsLoading, setAnalyticsLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    useEffect(() => {
        loadRevenueData();
    }, [revenueGroupBy]);

    const loadDashboardData = async () => {
        // Load basic stats
        const statsRes = await AdminService.getStats();
        if (statsRes.success) {
            setStats(statsRes.data);
        }
        setLoading(false);

        // Load analytics data in parallel
        await Promise.all([
            loadRevenueData(),
            loadPeakHours(),
            loadRecommendations(),
            loadPredictions(),
            loadCustomerInsights(),
            loadCourtPerformance(),
        ]);

        setAnalyticsLoading(false);
    };

    const loadRevenueData = async () => {
        const endDate = new Date().toISOString();
        const startDate = new Date();

        // Adjust date range based on groupBy
        if (revenueGroupBy === 'day') {
            startDate.setDate(startDate.getDate() - 30);
        } else if (revenueGroupBy === 'week') {
            startDate.setDate(startDate.getDate() - 90);
        } else {
            startDate.setMonth(startDate.getMonth() - 12);
        }

        const res = await AnalyticsService.getRevenueAnalytics(
            startDate.toISOString(),
            endDate,
            revenueGroupBy
        );
        if (res.success) {
            setRevenueData(res.data);
        }
    };

    const loadPeakHours = async () => {
        const res = await AnalyticsService.getPeakHoursData(undefined, true);
        if (res.success) {
            setPeakHoursData(res.data);
        }
    };

    const loadRecommendations = async () => {
        const res = await AnalyticsService.getSmartRecommendations();
        if (res.success) {
            setRecommendations(res.data);
        }
    };

    const loadPredictions = async () => {
        const res = await AnalyticsService.getCustomerPredictions();
        if (res.success) {
            setPredictions(res.data);
        }
    };

    const loadCustomerInsights = async () => {
        const res = await AnalyticsService.getCustomerInsights();
        if (res.success) {
            setCustomerInsights(res.data);
        }
    };

    const loadCourtPerformance = async () => {
        const endDate = new Date().toISOString();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const res = await AnalyticsService.getCourtPerformance(startDate.toISOString(), endDate);
        if (res.success) {
            setCourtPerformance(res.data);
        }
    };

    const handleApplyRecommendation = (recommendationId: string) => {
        console.log('Apply recommendation:', recommendationId);
        // TODO: Implement apply logic
    };

    const handleDismissRecommendation = (recommendationId: string) => {
        setRecommendations(recs => recs.map(r =>
            r.id === recommendationId ? { ...r, isDismissed: true } : r
        ));
    };

    const handleSendMessage = (userId: string, message: string) => {
        console.log('Send message to:', userId, message);
        // TODO: Implement messaging
    };

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            {/* Header with Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
                    <p className="text-slate-400">Tổng quan và phân tích chi tiết</p>
                </div>

                {/* Quick Actions - Desktop */}
                <div className="hidden md:flex items-center gap-3">
                    <button
                        onClick={() => navigate('/admin/courts')}
                        className="flex items-center gap-2 px-4 py-2 bg-lime-400 hover:bg-lime-500 text-slate-900 font-semibold rounded-lg transition-colors"
                    >
                        <Plus size={18} />
                        <span>Thêm sân mới</span>
                    </button>
                    <button
                        onClick={() => navigate('/admin/bookings')}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                    >
                        <Calendar size={18} />
                        <span>Xem lịch</span>
                    </button>
                </div>
            </div>

            {/* Quick Actions - Mobile (Horizontal Scroll) */}
            <div className="md:hidden flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                <button
                    onClick={() => navigate('/admin/courts')}
                    className="flex-shrink-0 flex flex-col items-center justify-center gap-2 w-24 h-24 bg-slate-800 rounded-xl border border-slate-700 active:scale-95 transition-transform"
                >
                    <div className="w-10 h-10 rounded-full bg-lime-400/20 flex items-center justify-center">
                        <Plus size={20} className="text-lime-400" />
                    </div>
                    <span className="text-xs font-medium text-slate-300">Thêm sân</span>
                </button>
                <button
                    onClick={() => navigate('/admin/bookings')}
                    className="flex-shrink-0 flex flex-col items-center justify-center gap-2 w-24 h-24 bg-slate-800 rounded-xl border border-slate-700 active:scale-95 transition-transform"
                >
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Calendar size={20} className="text-blue-400" />
                    </div>
                    <span className="text-xs font-medium text-slate-300">Lịch đặt</span>
                </button>
                <button
                    className="flex-shrink-0 flex flex-col items-center justify-center gap-2 w-24 h-24 bg-slate-800 rounded-xl border border-slate-700 active:scale-95 transition-transform"
                >
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <FileText size={20} className="text-yellow-400" />
                    </div>
                    <span className="text-xs font-medium text-slate-300">Báo cáo</span>
                </button>
                <button
                    className="flex-shrink-0 flex flex-col items-center justify-center gap-2 w-24 h-24 bg-slate-800 rounded-xl border border-slate-700 active:scale-95 transition-transform"
                >
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Users size={20} className="text-purple-400" />
                    </div>
                    <span className="text-xs font-medium text-slate-300">Khách hàng</span>
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <Card className="p-4 md:p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Building2 size={20} className="text-blue-400" />
                        </div>
                    </div>
                    <p className="text-xs md:text-sm text-slate-400 mb-1">Tổng sân</p>
                    <p className="text-xl md:text-2xl font-bold text-white">{stats?.totalCourts || 0}</p>
                </Card>

                <Card className="p-4 md:p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-lime-500/20 flex items-center justify-center">
                            <Calendar size={20} className="text-lime-400" />
                        </div>
                    </div>
                    <p className="text-xs md:text-sm text-slate-400 mb-1">Lượt đặt tháng</p>
                    <p className="text-xl md:text-2xl font-bold text-white">{stats?.totalBookings || 0}</p>
                </Card>

                <Card className="p-4 md:p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                            <DollarSign size={20} className="text-yellow-400" />
                        </div>
                    </div>
                    <p className="text-xs md:text-sm text-slate-400 mb-1">Doanh thu tháng</p>
                    <p className="text-xl md:text-2xl font-bold text-white">
                        {(stats?.monthlyRevenue || 0).toLocaleString()}đ
                    </p>
                </Card>

                <Card className="p-4 md:p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <TrendingUp size={20} className="text-purple-400" />
                        </div>
                    </div>
                    <p className="text-xs md:text-sm text-slate-400 mb-1">Tỷ lệ lấp đầy</p>
                    <p className="text-xl md:text-2xl font-bold text-white">{stats?.occupancyRate || 0}%</p>
                </Card>
            </div>

            {/* Revenue Chart */}
            <RevenueChart
                data={revenueData}
                loading={analyticsLoading}
                groupBy={revenueGroupBy}
                onGroupByChange={setRevenueGroupBy}
            />

            {/* Smart Recommendations */}
            <SmartRecommendations
                recommendations={recommendations}
                loading={analyticsLoading}
                onApply={handleApplyRecommendation}
                onDismiss={handleDismissRecommendation}
            />

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Peak Hours Heatmap */}
                <PeakHoursHeatmap
                    data={peakHoursData.data}
                    insights={peakHoursData.insights}
                    loading={analyticsLoading}
                />

                {/* Customer Insights */}
                {customerInsights && (
                    <CustomerInsights insights={customerInsights} loading={analyticsLoading} />
                )}
            </div>

            {/* Court Performance Table */}
            <CourtPerformance data={courtPerformance} loading={analyticsLoading} />

            {/* Customer Predictions */}
            <CustomerPredictions
                predictions={predictions}
                loading={analyticsLoading}
                onSendMessage={handleSendMessage}
            />
        </div>
    );
};
