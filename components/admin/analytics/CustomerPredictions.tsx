import React from 'react';
import { TrendingUp, AlertCircle, Star, Phone, Send } from 'lucide-react';
import type { CustomerPrediction } from '../../../types/social';

interface CustomerPredictionsProps {
    predictions: CustomerPrediction[];
    loading?: boolean;
    onSendMessage?: (userId: string, message: string) => void;
}

export const CustomerPredictions: React.FC<CustomerPredictionsProps> = ({
    predictions,
    loading = false,
    onSendMessage,
}) => {
    if (loading) {
        return (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
                <div className="h-6 bg-slate-700 rounded w-1/3 animate-pulse"></div>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-slate-700 rounded animate-pulse"></div>
                ))}
            </div>
        );
    }

    // Group predictions by type
    const likelyToBook = predictions.filter((p) => p.predictionType === 'likely_to_book');
    const churnRisk = predictions.filter((p) => p.predictionType === 'churn_risk');
    const vipPotential = predictions.filter((p) => p.predictionType === 'vip_potential');

    const getPredictionColor = (type: CustomerPrediction['predictionType']) => {
        switch (type) {
            case 'likely_to_book':
                return {
                    bg: 'from-green-500/10 to-emerald-500/10',
                    border: 'border-green-500/30',
                    badge: 'bg-green-500/20 text-green-400',
                    icon: TrendingUp,
                    iconColor: 'text-green-400',
                };
            case 'churn_risk':
                return {
                    bg: 'from-red-500/10 to-orange-500/10',
                    border: 'border-red-500/30',
                    badge: 'bg-red-500/20 text-red-400',
                    icon: AlertCircle,
                    iconColor: 'text-red-400',
                };
            case 'vip_potential':
                return {
                    bg: 'from-purple-500/10 to-pink-500/10',
                    border: 'border-purple-500/30',
                    badge: 'bg-purple-500/20 text-purple-400',
                    icon: Star,
                    iconColor: 'text-purple-400',
                };
        }
    };

    const renderPredictionCard = (prediction: CustomerPrediction) => {
        const colors = getPredictionColor(prediction.predictionType);
        const Icon = colors.icon;

        return (
            <div
                key={prediction.userId}
                className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-lg p-4`}
            >
                <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        {prediction.userAvatar ? (
                            <img
                                src={prediction.userAvatar}
                                alt={prediction.userName}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-lg font-bold text-white">
                                {prediction.userName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Name & Probability */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                                <h4 className="font-semibold text-white">{prediction.userName}</h4>
                                <p className="text-xs text-slate-400">{prediction.userPhone}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Icon size={16} className={colors.iconColor} />
                                <span className={`text-sm font-bold ${colors.badge.split(' ')[1]}`}>
                                    {prediction.probability}%
                                </span>
                            </div>
                        </div>

                        {/* Insight */}
                        <p className="text-sm text-slate-300 mb-3">{prediction.insight}</p>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="bg-slate-900/30 rounded px-2 py-1">
                                <p className="text-xs text-slate-400">Bookings</p>
                                <p className="text-sm font-semibold text-white">
                                    {prediction.totalBookings}
                                </p>
                            </div>
                            <div className="bg-slate-900/30 rounded px-2 py-1">
                                <p className="text-xs text-slate-400">Đã chi</p>
                                <p className="text-sm font-semibold text-white">
                                    {(prediction.totalSpent / 1000).toFixed(0)}K
                                </p>
                            </div>
                            <div className="bg-slate-900/30 rounded px-2 py-1">
                                <p className="text-xs text-slate-400">Tần suất</p>
                                <p className="text-sm font-semibold text-white">
                                    {prediction.averageFrequency.toFixed(0)}d
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={() =>
                                    onSendMessage &&
                                    prediction.suggestedAction.message &&
                                    onSendMessage(
                                        prediction.userId,
                                        prediction.suggestedAction.message
                                    )
                                }
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-lime-400 hover:bg-lime-500 text-slate-900 text-sm font-semibold rounded-lg transition-colors"
                            >
                                <Send size={14} />
                                <span>{prediction.suggestedAction.label}</span>
                            </button>
                            <a
                                href={`tel:${prediction.userPhone}`}
                                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                                title="Gọi điện"
                            >
                                <Phone size={16} className="text-slate-300" />
                            </a>
                        </div>

                        {/* Pre-filled message preview */}
                        {prediction.suggestedAction.message && (
                            <div className="mt-2 p-2 bg-slate-900/50 rounded text-xs text-slate-400 italic">
                                "{prediction.suggestedAction.message}"
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-1">Dự đoán khách hàng</h3>
                <p className="text-sm text-slate-400">
                    AI phân tích hành vi để dự đoán booking tiếp theo
                </p>
            </div>

            {/* Tabs/Sections */}
            <div className="space-y-6">
                {/* Likely to Book */}
                {likelyToBook.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="text-green-400" size={18} />
                            <h4 className="font-semibold text-white">Sắp đặt lịch</h4>
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                                {likelyToBook.length}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {likelyToBook.slice(0, 5).map(renderPredictionCard)}
                        </div>
                    </div>
                )}

                {/* Churn Risk */}
                {churnRisk.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <AlertCircle className="text-red-400" size={18} />
                            <h4 className="font-semibold text-white">Nguy cơ mất khách</h4>
                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                                {churnRisk.length}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {churnRisk.slice(0, 5).map(renderPredictionCard)}
                        </div>
                    </div>
                )}

                {/* VIP Potential */}
                {vipPotential.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Star className="text-purple-400" size={18} />
                            <h4 className="font-semibold text-white">Tiềm năng VIP</h4>
                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                                {vipPotential.length}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {vipPotential.slice(0, 5).map(renderPredictionCard)}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {predictions.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-slate-400 mb-2">📊</div>
                        <p className="text-slate-400">
                            Chưa đủ dữ liệu để tạo dự đoán. Cần ít nhất 10 bookings.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
