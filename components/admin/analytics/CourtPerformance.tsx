import React, { useState } from 'react';
import { ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';

interface CourtPerformanceData {
    courtId: string;
    courtName: string;
    totalRevenue: number;
    bookingsCount: number;
    occupancyRate: number;
    averageRating: number;
    totalReviews: number;
    revenuePerHour: number;
    pricePerHour: number;
}

interface CourtPerformanceProps {
    data: CourtPerformanceData[];
    loading?: boolean;
}

type SortKey = keyof CourtPerformanceData;
type SortDirection = 'asc' | 'desc';

export const CourtPerformance: React.FC<CourtPerformanceProps> = ({ data, loading = false }) => {
    const [sortKey, setSortKey] = useState<SortKey>('totalRevenue');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    if (loading) {
        return (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <div className="h-6 bg-slate-700 rounded w-1/3 mb-4 animate-pulse"></div>
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-slate-700 rounded animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    };

    const sortedData = [...data].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];

        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        return sortDirection === 'asc'
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));
    });

    const getOccupancyColor = (rate: number) => {
        if (rate < 30) return 'text-red-400 bg-red-500/20';
        if (rate < 60) return 'text-yellow-400 bg-yellow-500/20';
        return 'text-green-400 bg-green-500/20';
    };

    const maxRevenue = Math.max(...data.map((d) => d.totalRevenue));
    const maxBookings = Math.max(...data.map((d) => d.bookingsCount));

    return (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-1">Hiệu suất từng sân</h3>
                <p className="text-sm text-slate-400">So sánh performance của các sân</p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th className="text-left py-3 px-2">
                                <button
                                    onClick={() => handleSort('courtName')}
                                    className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                                >
                                    Tên sân
                                    <ArrowUpDown size={12} />
                                </button>
                            </th>
                            <th className="text-right py-3 px-2">
                                <button
                                    onClick={() => handleSort('totalRevenue')}
                                    className="flex items-center gap-1 ml-auto text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                                >
                                    Doanh thu
                                    <ArrowUpDown size={12} />
                                </button>
                            </th>
                            <th className="text-right py-3 px-2">
                                <button
                                    onClick={() => handleSort('bookingsCount')}
                                    className="flex items-center gap-1 ml-auto text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                                >
                                    Bookings
                                    <ArrowUpDown size={12} />
                                </button>
                            </th>
                            <th className="text-center py-3 px-2">
                                <button
                                    onClick={() => handleSort('occupancyRate')}
                                    className="flex items-center gap-1 mx-auto text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                                >
                                    Công suất
                                    <ArrowUpDown size={12} />
                                </button>
                            </th>
                            <th className="text-right py-3 px-2">
                                <button
                                    onClick={() => handleSort('revenuePerHour')}
                                    className="flex items-center gap-1 ml-auto text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                                >
                                    VND/giờ
                                    <ArrowUpDown size={12} />
                                </button>
                            </th>
                            <th className="text-center py-3 px-2">
                                <button
                                    onClick={() => handleSort('averageRating')}
                                    className="flex items-center gap-1 mx-auto text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                                >
                                    Đánh giá
                                    <ArrowUpDown size={12} />
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((court, index) => (
                            <tr
                                key={court.courtId}
                                className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                            >
                                {/* Court Name */}
                                <td className="py-4 px-2">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${index === 0
                                                ? 'bg-lime-400/20 text-lime-400'
                                                : 'bg-slate-700 text-slate-400'
                                                }`}
                                        >
                                            {index + 1}
                                        </div>
                                        <span className="font-medium text-white">{court.courtName}</span>
                                    </div>
                                </td>

                                {/* Revenue with bar */}
                                <td className="py-4 px-2">
                                    <div className="text-right">
                                        <p className="font-semibold text-white mb-1">
                                            {(court.totalRevenue / 1000).toFixed(0)}K
                                        </p>
                                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-lime-400 rounded-full transition-all"
                                                style={{
                                                    width: `${(court.totalRevenue / maxRevenue) * 100}%`,
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </td>

                                {/* Bookings with bar */}
                                <td className="py-4 px-2">
                                    <div className="text-right">
                                        <p className="font-semibold text-white mb-1">
                                            {court.bookingsCount}
                                        </p>
                                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-400 rounded-full transition-all"
                                                style={{
                                                    width: `${(court.bookingsCount / maxBookings) * 100}%`,
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </td>

                                {/* Occupancy Rate */}
                                <td className="py-4 px-2">
                                    <div className="flex justify-center">
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-semibold ${getOccupancyColor(
                                                court.occupancyRate
                                            )}`}
                                        >
                                            {court.occupancyRate.toFixed(0)}%
                                        </span>
                                    </div>
                                </td>

                                {/* Revenue per hour */}
                                <td className="py-4 px-2 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        {court.revenuePerHour > court.pricePerHour ? (
                                            <TrendingUp size={14} className="text-green-400" />
                                        ) : (
                                            <TrendingDown size={14} className="text-red-400" />
                                        )}
                                        <span className="font-semibold text-white">
                                            {(court.revenuePerHour / 1000).toFixed(0)}K
                                        </span>
                                    </div>
                                </td>

                                {/* Rating */}
                                <td className="py-4 px-2 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <span className="text-yellow-400">★</span>
                                        <span className="font-semibold text-white">
                                            {court.averageRating > 0
                                                ? court.averageRating.toFixed(1)
                                                : '—'}
                                        </span>
                                        {court.totalReviews > 0 && (
                                            <span className="text-xs text-slate-400">
                                                ({court.totalReviews})
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 pt-6 border-t border-slate-700 grid grid-cols-4 gap-4">
                <div className="text-center">
                    <p className="text-xs text-slate-400 mb-1">Tổng doanh thu</p>
                    <p className="text-lg font-bold text-white">
                        {(data.reduce((sum, d) => sum + d.totalRevenue, 0) / 1000000).toFixed(1)}M
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-slate-400 mb-1">Tổng bookings</p>
                    <p className="text-lg font-bold text-white">
                        {data.reduce((sum, d) => sum + d.bookingsCount, 0)}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-slate-400 mb-1">Công suất TB</p>
                    <p className="text-lg font-bold text-white">
                        {(
                            data.reduce((sum, d) => sum + d.occupancyRate, 0) / data.length
                        ).toFixed(0)}
                        %
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-slate-400 mb-1">Đánh giá TB</p>
                    <p className="text-lg font-bold text-white">
                        {(
                            data.reduce((sum, d) => sum + d.averageRating, 0) / data.length
                        ).toFixed(1)}
                        ★
                    </p>
                </div>
            </div>
        </div>
    );
};
