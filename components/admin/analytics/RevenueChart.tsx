import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { RevenueDataPoint } from '../../../types/social';

interface RevenueChartProps {
    data: RevenueDataPoint[];
    loading?: boolean;
    groupBy?: 'day' | 'week' | 'month';
    onGroupByChange?: (groupBy: 'day' | 'week' | 'month') => void;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
    data,
    loading = false,
    groupBy = 'day',
    onGroupByChange,
}) => {
    if (loading) {
        return (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 animate-pulse">
                <div className="h-8 bg-slate-700 rounded w-1/3 mb-6"></div>
                <div className="h-64 bg-slate-700 rounded"></div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4">Doanh thu</h3>
                <div className="flex items-center justify-center h-64 text-slate-400">
                    Chưa có dữ liệu doanh thu
                </div>
            </div>
        );
    }

    // Calculate metrics
    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    const avgRevenue = data.length > 0 ? totalRevenue / data.length : 0;
    const maxRevenue = Math.max(...data.map(d => d.revenue));

    // Calculate trend (compare last point with first point)
    const trend = data.length >= 2
        ? ((data[data.length - 1].revenue - data[0].revenue) / data[0].revenue) * 100
        : 0;

    // Calculate chart dimensions
    const chartHeight = 200;
    const chartWidth = 100; // percentage
    const padding = { top: 10, bottom: 30, left: 50, right: 10 };

    // Generate SVG path
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * chartWidth;
        const y = chartHeight - (d.revenue / maxRevenue) * (chartHeight - padding.top - padding.bottom);
        return { x, y, data: d };
    });

    const linePath = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
        .join(' ');

    const areaPath = `
        M 0 ${chartHeight}
        L 0 ${points[0].y}
        ${linePath.substring(2)}
        L ${chartWidth} ${chartHeight}
        Z
    `;

    return (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">Doanh thu</h3>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-lime-400">
                            {totalRevenue.toLocaleString()}đ
                        </span>
                        <div
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${trend >= 0
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}
                        >
                            {trend >= 0 ? (
                                <TrendingUp size={14} />
                            ) : (
                                <TrendingDown size={14} />
                            )}
                            {Math.abs(trend).toFixed(1)}%
                        </div>
                    </div>
                </div>

                {/* Group By Selector */}
                {onGroupByChange && (
                    <div className="flex gap-2">
                        {(['day', 'week', 'month'] as const).map((period) => (
                            <button
                                key={period}
                                onClick={() => onGroupByChange(period)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${groupBy === period
                                        ? 'bg-lime-400 text-slate-900'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                {period === 'day' ? 'Ngày' : period === 'week' ? 'Tuần' : 'Tháng'}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Chart */}
            <div className="relative" style={{ height: chartHeight + 40 }}>
                <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full"
                    preserveAspectRatio="none"
                >
                    {/* Grid lines */}
                    {[0, 25, 50, 75, 100].map((percent) => {
                        const y = chartHeight - (percent / 100) * (chartHeight - padding.top - padding.bottom);
                        return (
                            <g key={percent}>
                                <line
                                    x1={0}
                                    y1={y}
                                    x2={chartWidth}
                                    y2={y}
                                    stroke="#334155"
                                    strokeWidth="0.5"
                                    strokeDasharray="2,2"
                                />
                                <text
                                    x={-2}
                                    y={y}
                                    fill="#94a3b8"
                                    fontSize="10"
                                    textAnchor="end"
                                    dominantBaseline="middle"
                                >
                                    {((maxRevenue * percent) / 100 / 1000).toFixed(0)}K
                                </text>
                            </g>
                        );
                    })}

                    {/* Area gradient */}
                    <defs>
                        <linearGradient id="revenue-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a3e635" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#a3e635" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Area */}
                    <path d={areaPath} fill="url(#revenue-gradient)" />

                    {/* Line */}
                    <path
                        d={linePath}
                        fill="none"
                        stroke="#a3e635"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Points */}
                    {points.map((p, i) => (
                        <g key={i}>
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r="3"
                                fill="#a3e635"
                                className="hover:r-5 transition-all cursor-pointer"
                            />
                        </g>
                    ))}
                </svg>

                {/* X-axis labels */}
                <div className="flex justify-between mt-2 px-1">
                    {data.map((d, i) => {
                        // Show max 7 labels
                        if (data.length > 7 && i % Math.ceil(data.length / 7) !== 0) return null;

                        const date = new Date(d.date);
                        let label = '';
                        if (groupBy === 'day') {
                            label = `${date.getDate()}/${date.getMonth() + 1}`;
                        } else if (groupBy === 'week') {
                            label = `W${Math.ceil(date.getDate() / 7)}`;
                        } else {
                            label = date.toLocaleDateString('vi-VN', { month: 'short' });
                        }

                        return (
                            <span key={i} className="text-xs text-slate-400">
                                {label}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-700">
                <div>
                    <p className="text-xs text-slate-400 mb-1">Tổng booking</p>
                    <p className="text-lg font-bold text-white">
                        {data.reduce((sum, d) => sum + d.bookingsCount, 0)}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-slate-400 mb-1">Trung bình/ngày</p>
                    <p className="text-lg font-bold text-white">
                        {avgRevenue.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}đ
                    </p>
                </div>
                <div>
                    <p className="text-xs text-slate-400 mb-1">Giá trị TB/booking</p>
                    <p className="text-lg font-bold text-white">
                        {data.length > 0
                            ? (
                                totalRevenue /
                                data.reduce((sum, d) => sum + d.bookingsCount, 0)
                            ).toLocaleString('vi-VN', { maximumFractionDigits: 0 })
                            : 0}
                        đ
                    </p>
                </div>
            </div>
        </div>
    );
};
