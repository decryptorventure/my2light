import React, { useEffect, useState } from 'react';
import { PlayerCard } from '../../components/social/PlayerCard';
import { SocialService } from '../../services/social';
import { SocialProfile } from '../../types/social';
import { SkeletonListItem, SkeletonCard } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { Search, MapPin } from 'lucide-react';

export const Discover: React.FC = () => {
    const { showToast } = useToast();
    const [suggestions, setSuggestions] = useState<SocialProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadSuggestions();
    }, []);

    const loadSuggestions = async () => {
        setLoading(true);
        const res = await SocialService.getSuggestedPlayers();
        if (res.success && res.data) {
            setSuggestions(res.data);
        } else {
            showToast('Không thể tải danh sách gợi ý', 'error');
        }
        setLoading(false);
    };

    const handleFollowAction = async (id: string) => {
        const res = await SocialService.followPlayer(id);
        if (res.success) {
            showToast('Đã gửi lời mời kết bạn', 'success');
            setSuggestions(prev => prev.filter(p => p.id !== id));
        } else {
            showToast(res.error || 'Có lỗi xảy ra', 'error');
        }
    };

    const handleFollowSuccess = (id: string) => {
        setSuggestions(prev => prev.filter(p => p.id !== id));
    };

    if (loading) {
        return (
            <div className="pb-20 p-4 space-y-6">
                <div className="relative">
                    <div className="w-full h-12 bg-slate-800 rounded-xl animate-pulse" />
                </div>
                <div>
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex-shrink-0 w-32">
                                <div className="h-40 bg-slate-800 rounded-xl animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-3">
                    <SkeletonListItem />
                    <SkeletonListItem />
                    <SkeletonListItem />
                </div>
            </div>
        );
    }

    return (
        <div className="pb-20 p-4 space-y-6">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Tìm kiếm người chơi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 transition-colors"
                />
            </div>

            {/* Nearby Players (Mock) */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <MapPin size={18} className="text-lime-400" />
                        Gần bạn
                    </h3>
                    <button className="text-sm text-lime-400 font-medium">Xem tất cả</button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                    {suggestions.slice(0, 5).map(player => (
                        <div key={player.id} className="flex-shrink-0 w-32">
                            <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-full bg-slate-700 overflow-hidden mb-2 border-2 border-slate-600">
                                    {player.avatarUrl ? (
                                        <img src={player.avatarUrl} alt={player.fullName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xl">
                                            {player.fullName?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <h4 className="text-white font-semibold text-sm truncate w-full">{player.fullName}</h4>
                                <p className="text-slate-500 text-xs mb-2">{player.skillLevel}</p>
                                <button
                                    onClick={() => handleFollowAction(player.id)}
                                    className="w-full py-1.5 bg-lime-400 text-slate-900 rounded-lg text-xs font-bold hover:bg-lime-500 transition-colors"
                                >
                                    Kết bạn
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Suggestions List */}
            <div>
                <h3 className="text-lg font-bold text-white mb-3">Gợi ý cho bạn</h3>
                <div className="space-y-3">
                    {suggestions.map(player => (
                        <PlayerCard
                            key={player.id}
                            player={player}
                            onFollow={handleFollowSuccess}
                            variant="suggestion"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
