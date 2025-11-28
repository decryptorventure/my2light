import React from 'react';
import { Heart, MessageCircle, Share2, UserPlus, MoreHorizontal } from 'lucide-react';
import { Activity } from '../../types/social';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ActivityCardProps {
    activity: Activity;
    onLike: (id: string) => void;
    onComment: (id: string) => void;
    onShare: (id: string) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onLike, onComment, onShare }) => {
    const { user, activity_type, metadata, created_at } = activity;

    const renderContent = () => {
        switch (activity_type) {
            case 'highlight_post':
                return (
                    <div className="mt-3">
                        <p className="text-slate-300 text-sm mb-3">{metadata.caption}</p>
                        {metadata.thumbnail_url && (
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900">
                                <img
                                    src={metadata.thumbnail_url}
                                    alt="Highlight"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'match_completed':
                return (
                    <div className="mt-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-lime-400 font-bold text-lg">WIN</span>
                            <span className="text-slate-400 text-sm">{metadata.score}</span>
                        </div>
                        <p className="text-slate-300 text-sm">
                            Đã thắng trận đấu tại <span className="font-semibold text-white">{metadata.court_name}</span>
                        </p>
                    </div>
                );
            case 'new_follower':
                return (
                    <div className="mt-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 flex items-center gap-3">
                        <UserPlus size={20} className="text-blue-400" />
                        <p className="text-blue-200 text-sm">Đã bắt đầu theo dõi bạn</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-slate-900 border-b border-slate-800 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                        {user?.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                                {user?.full_name?.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div>
                        <h4 className="text-white font-semibold text-sm">{user?.full_name}</h4>
                        <p className="text-slate-500 text-xs">
                            {formatDistanceToNow(new Date(created_at), { addSuffix: true, locale: vi })}
                        </p>
                    </div>
                </div>
                <button className="text-slate-500 hover:text-white transition-colors">
                    <MoreHorizontal size={20} />
                </button>
            </div>

            {/* Content */}
            {renderContent()}

            {/* Actions */}
            <div className="flex items-center gap-6 mt-4 pt-3 border-t border-slate-800/50">
                <button
                    onClick={() => onLike(activity.id)}
                    className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition-colors group"
                >
                    <Heart size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">{metadata.likes_count || 0}</span>
                </button>
                <button
                    onClick={() => onComment(activity.id)}
                    className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors group"
                >
                    <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">{metadata.comments_count || 0}</span>
                </button>
                <button
                    onClick={() => onShare(activity.id)}
                    className="flex items-center gap-2 text-slate-400 hover:text-green-400 transition-colors group ml-auto"
                >
                    <Share2 size={20} className="group-hover:scale-110 transition-transform" />
                </button>
            </div>
        </div>
    );
};
