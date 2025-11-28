import React, { useState } from 'react';
import { Flame, TrendingDown, Lightbulb, Sparkles } from 'lucide-react';
import type { PeakHoursData, PeakHoursInsight } from '../../../types/social';

interface PeakHoursHeatmapProps {
    data: PeakHoursData[];
    insights: PeakHoursInsight;
    loading?: boolean;
}

export const PeakHoursHeatmap: React.FC<PeakHoursHeatmapProps> = ({
    data,
    insights,
    loading = false,
}) => {
    const [viewMode, setViewMode] = useState<'bookings' | 'revenue'>('bookings');
    const [selectedCell, setSelectedCell] = useState<PeakHoursData | null>(null);

    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM - 10 PM

    if (loading) {
        return (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 animate-pulse">
                <div className="h-8 bg-slate-700 rounded w-1/3 mb-6"></div>
                <div className="h-96 bg-slate-700 rounded"></div>
            </div>
        );
    }

    // Get max value for color scaling
    const maxValue = Math.max(
        ...data.map((d) => (viewMode === 'bookings' ? d.bookingsCount : d.revenue))
    );

    // Get color based on value
    const getColor = (value: number): string => {
        if (value === 0) return 'bg-slate-700';
        const intensity = (value / maxValue) * 100;
        if (intensity < 20) return 'bg-lime-900/40';
        if (intensity < 40) return 'bg-lime-800/60';
        if (intensity < 60) return 'bg-lime-600/80';
        if (intensity < 80) return 'bg-lime-500';
        return 'bg-lime-400';
    };

    // Find data for specific day/hour
    const getCellData = (day: number, hour: number): PeakHoursData | undefined => {
        return data.find((d) => d.dayOfWeek === day && d.hour === hour);
    };

    return (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">Giờ cao điểm</h3>
                    <p className="text-sm text-slate-400">
                        Phân tích booking theo giờ và ngày trong tuần
                    </p>
                </div>

                {/* View Mode Toggle */}
                <div className="flex gap-2 bg-slate-700 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('bookings')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'bookings'
                                ? 'bg-lime-400 text-slate-900'
                                : 'text-slate-300 hover:text-white'
                            }`}
                    >
                        Bookings
                    </button>
                    <button
                        onClick={() => setViewMode('revenue')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'revenue'
                                ? 'bg-lime-400 text-slate-900'
                                : 'text-slate-300 hover:text-white'
                            }`}
                    >
                        Doanh thu
                    </button>
                </div>
            </div>

            {/* Heatmap Grid */}
            <div className="mb-6 overflow-x-auto">
                <div className="inline-block min-w-full">
                    {/* Hour labels */}
                    <div className="flex mb-2">
                        <div className="w-12"></div>
                        {hours.map((hour) => (
                            <div
                                key={hour}
                                className="flex-1 text-center text-xs text-slate-400 min-w-[40px]"
                            >
                                {hour}h
                            </div>
                        ))}
                    </div>

                    {/* Heatmap rows */}
                    {days.map((day, dayIndex) => (
                        <div key={day} className="flex mb-1">
                            {/* Day label */}
                            <div className="w-12 flex items-center">
                                <span className="text-xs font-medium text-slate-400">{day}</span>
                            </div>

                            {/* Hour cells */}
                            {hours.map((hour) => {
                                const cellData = getCellData(dayIndex, hour);
                                const value = cellData
                                    ? viewMode === 'bookings'
                                        ? cellData.bookingsCount
                                        : cellData.revenue
                                    : 0;

                                return (
                                    <div
                                        key={`${day}-${hour}`}
                                        onClick={() => setSelectedCell(cellData || null)}
                                        className={`flex-1 min-w-[40px] aspect-square rounded cursor-pointer transition-all hover:scale-110 hover:shadow-lg ${getColor(
                                            value
                                        )}`}
                                        title={`${day} ${hour}:00 - ${value} ${viewMode === 'bookings' ? 'bookings' : 'VND'
                                            }`}
                                    >
                                        {value > 0 && (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-xs font-bold text-slate-900">
                                                    {value}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-2 mt-4">
                    <span className="text-xs text-slate-400">Thấp</span>
                    <div className="flex gap-1">
                        {['bg-slate-700', 'bg-lime-900/40', 'bg-lime-800/60', 'bg-lime-600/80', 'bg-lime-500', 'bg-lime-400'].map(
                            (color, i) => (
                                <div key={i} className={`w-6 h-6 rounded ${color}`}></div>
                            )
                        )}
                    </div>
                    <span className="text-xs text-slate-400">Cao</span>
                </div>
            </div>

            {/* Smart Insights Panel - WOW FACTOR! */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Peak Hours Insight */}
                <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-500/20 rounded-lg">
                            <Flame className="text-orange-400" size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-white mb-1 flex items-center gap-2">
                                Giờ Cao Điểm
                                <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                                    {insights.peakBookings} bookings
                                </span>
                            </h4>
                            <p className="text-sm text-slate-300">{insights.peakHour}</p>
                        </div>
                    </div>
                </div>

                {/* Slow Hours Insight */}
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <TrendingDown className="text-blue-400" size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-white mb-1 flex items-center gap-2">
                                Giờ Vắng
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                                    {insights.slowBookings} bookings
                                </span>
                            </h4>
                            <p className="text-sm text-slate-300">{insights.slowHour}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Recommendation - THE WOW MOMENT! */}
            <div className="mt-4 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-lime-400/10 border border-lime-400/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-lime-400/20 rounded-lg">
                        <Sparkles className="text-lime-400" size={20} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-white">Gợi ý thông minh</h4>
                            <span className="text-xs bg-lime-400/20 text-lime-400 px-2 py-0.5 rounded-full font-semibold">
                                AI-Powered
                            </span>
                        </div>
                        <p className="text-sm text-slate-300 mb-3">{insights.recommendation}</p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Lightbulb size={14} className="text-lime-400" />
                                <span>Tác động dự kiến: {insights.expectedImpact}</span>
                            </div>
                            <button className="px-4 py-2 bg-lime-400 hover:bg-lime-500 text-slate-900 text-sm font-semibold rounded-lg transition-colors">
                                Tạo khuyến mãi
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Selected Cell Details */}
            {selectedCell && (
                <div className="mt-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                    <h4 className="font-semibold text-white mb-2">
                        {days[selectedCell.dayOfWeek]} {selectedCell.hour}:00 -{' '}
                        {selectedCell.hour + 1}:00
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-400">Bookings</p>
                            <p className="text-lg font-bold text-white">
                                {selectedCell.bookingsCount}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Doanh thu</p>
                            <p className="text-lg font-bold text-lime-400">
                                {selectedCell.revenue.toLocaleString()}đ
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
