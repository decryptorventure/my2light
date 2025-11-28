import React, { useState } from 'react';
import {
    TrendingUp,
    Users,
    Package,
    Building2,
    X,
    CheckCircle2,
    Sparkles,
    ChevronRight,
} from 'lucide-react';
import type { SmartRecommendation } from '../../../types/social';

interface SmartRecommendationsProps {
    recommendations: SmartRecommendation[];
    loading?: boolean;
    onApply?: (recommendationId: string) => void;
    onDismiss?: (recommendationId: string) => void;
}

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
    recommendations,
    loading = false,
    onApply,
    onDismiss,
}) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Filter out dismissed recommendations
    const activeRecs = recommendations.filter((r) => !r.isDismissed);

    if (loading) {
        return (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
                <div className="h-6 bg-slate-700 rounded w-1/3 animate-pulse"></div>
                {[1, 2].map((i) => (
                    <div key={i} className="h-32 bg-slate-700 rounded animate-pulse"></div>
                ))}
            </div>
        );
    }

    if (activeRecs.length === 0) {
        return (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="text-lime-400" size={20} />
                    <h3 className="text-lg font-bold text-white">Gợi ý thông minh</h3>
                    <span className="text-xs bg-lime-400/20 text-lime-400 px-2 py-0.5 rounded-full font-semibold">
                        AI-Powered
                    </span>
                </div>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle2 className="text-green-400 mb-3" size={48} />
                    <p className="text-white font-semibold mb-1">Tất cả đều tốt!</p>
                    <p className="text-sm text-slate-400">
                        Chưa có gợi ý mới. Hệ thống đang hoạt động hiệu quả.
                    </p>
                </div>
            </div>
        );
    }

    const getIcon = (type: SmartRecommendation['type']) => {
        switch (type) {
            case 'pricing':
                return TrendingUp;
            case 'retention':
                return Users;
            case 'upsell':
                return Package;
            case 'capacity':
                return Building2;
            default:
                return Sparkles;
        }
    };

    const getColor = (type: SmartRecommendation['type']) => {
        switch (type) {
            case 'pricing':
                return {
                    bg: 'from-blue-500/10 to-cyan-500/10',
                    border: 'border-blue-500/30',
                    iconBg: 'bg-blue-500/20',
                    iconColor: 'text-blue-400',
                    badge: 'bg-blue-500/20 text-blue-400',
                };
            case 'retention':
                return {
                    bg: 'from-purple-500/10 to-pink-500/10',
                    border: 'border-purple-500/30',
                    iconBg: 'bg-purple-500/20',
                    iconColor: 'text-purple-400',
                    badge: 'bg-purple-500/20 text-purple-400',
                };
            case 'upsell':
                return {
                    bg: 'from-orange-500/10 to-yellow-500/10',
                    border: 'border-orange-500/30',
                    iconBg: 'bg-orange-500/20',
                    iconColor: 'text-orange-400',
                    badge: 'bg-orange-500/20 text-orange-400',
                };
            case 'capacity':
                return {
                    bg: 'from-green-500/10 to-lime-500/10',
                    border: 'border-green-500/30',
                    iconBg: 'bg-green-500/20',
                    iconColor: 'text-green-400',
                    badge: 'bg-green-500/20 text-green-400',
                };
            default: // marketing or others
                return {
                    bg: 'from-slate-500/10 to-gray-500/10',
                    border: 'border-slate-500/30',
                    iconBg: 'bg-slate-500/20',
                    iconColor: 'text-slate-400',
                    badge: 'bg-slate-500/20 text-slate-400',
                };
        }
    };

    const getTypeLabel = (type: SmartRecommendation['type']) => {
        switch (type) {
            case 'pricing':
                return 'Tối ưu giá';
            case 'retention':
                return 'Giữ chân khách';
            case 'upsell':
                return 'Tăng doanh thu';
            case 'capacity':
                return 'Quản lý năng lực';
        }
    };

    return (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-lime-400" size={20} />
                    <h3 className="text-lg font-bold text-white">Gợi ý thông minh</h3>
                    <span className="text-xs bg-lime-400/20 text-lime-400 px-2 py-0.5 rounded-full font-semibold">
                        AI-Powered
                    </span>
                </div>
                <span className="text-sm text-slate-400">{activeRecs.length} gợi ý</span>
            </div>

            {/* Recommendations List */}
            <div className="space-y-4">
                {activeRecs.map((rec) => {
                    const Icon = getIcon(rec.type);
                    const colors = getColor(rec.type);
                    const isExpanded = expandedId === rec.id;

                    return (
                        <div
                            key={rec.id}
                            className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-lg overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-lime-400/50' : ''
                                }`}
                        >
                            {/* Main Content */}
                            <div className="p-4">
                                <div className="flex items-start gap-3">
                                    {/* Icon */}
                                    <div className={`p-2 ${colors.iconBg} rounded-lg flex-shrink-0`}>
                                        <Icon className={colors.iconColor} size={20} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Title & Badge */}
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div>
                                                <h4 className="font-semibold text-white mb-1">
                                                    {rec.title}
                                                </h4>
                                                <span
                                                    className={`inline-block text-xs ${colors.badge} px-2 py-0.5 rounded-full font-medium`}
                                                >
                                                    {getTypeLabel(rec.type)}
                                                </span>
                                            </div>

                                            {/* Dismiss Button */}
                                            {onDismiss && !rec.isApplied && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDismiss(rec.id);
                                                    }}
                                                    className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                                                    title="Bỏ qua"
                                                >
                                                    <X size={16} className="text-slate-400" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Description */}
                                        <p className="text-sm text-slate-300 mb-3">{rec.description}</p>

                                        {/* Metrics Row */}
                                        <div className="flex flex-wrap items-center gap-4 mb-3">
                                            {/* Confidence */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400">
                                                    Độ tin cậy:
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <div className="h-2 w-20 bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-lime-400 rounded-full transition-all"
                                                            style={{ width: `${rec.confidence}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-semibold text-lime-400">
                                                        {rec.confidence}%
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Expected Impact */}
                                            {rec.expectedImpact && (
                                                <div className="flex items-center gap-1 text-xs">
                                                    <TrendingUp size={14} className="text-green-400" />
                                                    <span className="text-slate-400">Tác động:</span>
                                                    <span className="text-green-400 font-semibold">
                                                        {rec.expectedImpact.description}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2">
                                            {!rec.isApplied ? (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            onApply && onApply(rec.id)
                                                        }
                                                        className="flex items-center gap-2 px-4 py-2 bg-lime-400 hover:bg-lime-500 text-slate-900 text-sm font-semibold rounded-lg transition-colors"
                                                    >
                                                        <span>{rec.action.label}</span>
                                                        <ChevronRight size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setExpandedId(
                                                                isExpanded ? null : rec.id
                                                            )
                                                        }
                                                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-lg transition-colors"
                                                    >
                                                        {isExpanded ? 'Thu gọn' : 'Chi tiết'}
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 text-sm font-semibold rounded-lg">
                                                    <CheckCircle2 size={16} />
                                                    <span>Đã áp dụng</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="px-4 pb-4 pt-2 border-t border-slate-700/50">
                                    <h5 className="text-sm font-semibold text-white mb-2">
                                        Chi tiết phân tích
                                    </h5>
                                    <div className="bg-slate-900/50 rounded-lg p-3 text-xs text-slate-300 space-y-1">
                                        <p>• Dựa trên dữ liệu 30 ngày gần nhất</p>
                                        <p>• Thuật toán so sánh với benchmark ngành</p>
                                        <p>• Kết quả được tối ưu cho từng sân cụ thể</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer note */}
            <div className="mt-6 pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-400 text-center">
                    💡 Gợi ý được cập nhật mỗi ngày dựa trên dữ liệu thực tế của bạn
                </p>
            </div>
        </div>
    );
};
