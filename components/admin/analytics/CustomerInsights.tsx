import React from 'react';
import { Users, TrendingUp, DollarSign, Award } from 'lucide-react';
import type { CustomerInsight } from '../../../types/social';

interface CustomerInsightsProps {
    insights: CustomerInsight;
    loading?: boolean;
}

export const CustomerInsights: React.FC<CustomerInsightsProps> = ({ insights, loading = false }) => {
    if (loading) {
        return (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
                <div className="h-6 bg-slate-700 rounded w-1/3 animate-pulse"></div>
                <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 bg-slate-700 rounded animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
                <Users className="text-lime-400" size={20} />
                <h3 className="text-lg font-bold text-white">Phân tích khách hàng</h3>
            </div>

            {/* Pie Chart - New vs Returning */}
            <div className="mb-6">
                <h4 className="text-sm font-semibold text-white mb-3">Khách mới vs Khách quen</h4>
                <div className="flex items-center gap-4">
                    {/* Simple Pie representation */}
                    <div className="flex-shrink-0">
                        <svg width="120" height="120" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="50" fill="#1e293b" />
                            {/* New customers slice */}
                            <path
                                d={`M 60 60 L 60 10 A 50 50 0 ${insights.newVsReturningPercent.new > 50 ? 1 : 0
                                    } 1 ${60 + 50 * Math.sin((insights.newVsReturningPercent.new / 100) * 2 * Math.PI)
                                    } ${60 - 50 * Math.cos((insights.newVsReturningPercent.new / 100) * 2 * Math.PI)
                                    } Z`}
                                fill="#a3e635"
                            />
                            {/* Returning customers slice */}
                            <path
                                d={`M 60 60 L ${60 + 50 * Math.sin((insights.newVsReturningPercent.new / 100) * 2 * Math.PI)
                                    } ${60 - 50 * Math.cos((insights.newVsReturningPercent.new / 100) * 2 * Math.PI)
                                    } A 50 50 0 ${insights.newVsReturningPercent.returning > 50 ? 1 : 0
                                    } 1 60 10 Z`}
                                fill="#3b82f6"
                            />
                        </svg>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-lime-400"></div>
                                <span className="text-sm text-slate-300">Khách mới</span>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-white">{insights.newCustomers}</p>
                                <p className="text-xs text-slate-400">
                                    {insights.newVsReturningPercent.new.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-sm text-slate-300">Khách quen</span>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-white">
                                    {insights.returningCustomers}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {insights.newVsReturningPercent.returning.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="text-green-400" size={16} />
                        <span className="text-xs text-slate-400">Tần suất TB</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {insights.averageBookingFrequency.toFixed(1)}
                    </p>
                    <p className="text-xs text-slate-400">bookings/tháng</p>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="text-lime-400" size={16} />
                        <span className="text-xs text-slate-400">CLV TB</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {(insights.averageCustomerLifetimeValue / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs text-slate-400">VND/khách</p>
                </div>
            </div>

            {/* Top Customers */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Award className="text-yellow-400" size={18} />
                    <h4 className="text-sm font-semibold text-white">Top khách hàng</h4>
                </div>
                <div className="space-y-2">
                    {insights.topCustomers.slice(0, 5).map((customer, index) => (
                        <div
                            key={customer.userId}
                            className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 transition-colors"
                        >
                            {/* Rank */}
                            <div
                                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0
                                        ? 'bg-yellow-500/20 text-yellow-400'
                                        : index === 1
                                            ? 'bg-slate-400/20 text-slate-300'
                                            : index === 2
                                                ? 'bg-orange-600/20 text-orange-400'
                                                : 'bg-slate-700 text-slate-400'
                                    }`}
                            >
                                {index + 1}
                            </div>

                            {/* Avatar */}
                            {customer.avatar ? (
                                <img
                                    src={customer.avatar}
                                    alt={customer.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
                                    {customer.name.charAt(0).toUpperCase()}
                                </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">{customer.name}</p>
                                <p className="text-xs text-slate-400">
                                    {customer.bookingsCount} bookings •{' '}
                                    {(customer.totalSpent / 1000).toFixed(0)}K VND
                                </p>
                            </div>

                            {/* Total Spent */}
                            <div className="text-right">
                                <p className="text-lg font-bold text-lime-400">
                                    {(customer.totalSpent / 1000).toFixed(0)}K
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
