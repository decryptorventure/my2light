import React, { useEffect, useState } from 'react';
import { PlayerCard } from '../../components/social/PlayerCard';
import { SocialService } from '../../services/social';
import { SocialConnection } from '../../types/social';
import { SkeletonListItem } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';

export const Connections: React.FC = () => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
    const [connections, setConnections] = useState<SocialConnection[]>([]);
    const [requests, setRequests] = useState<SocialConnection[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [connRes, reqRes] = await Promise.all([
            SocialService.getConnections('accepted'), // Assuming API supports filtering by status
            SocialService.getConnections('pending')
        ]);

        if (connRes.success && connRes.data) setConnections(connRes.data);
        if (reqRes.success && reqRes.data) setRequests(reqRes.data);

        setLoading(false);
    };

    const handleUnfollow = async (id: string) => {
        if (!confirm('Bạn có chắc muốn hủy kết bạn?')) return;

        const res = await SocialService.unfollowPlayer(id);
        if (res.success) {
            setConnections(prev => prev.filter(c => c.userId !== id));
            showToast('Đã hủy kết bạn', 'success');
        } else {
            showToast(res.error || 'Lỗi', 'error');
        }
    };

    const handleAccept = async (connectionId: string) => {
        const res = await SocialService.acceptRequest(connectionId);
        if (res.success) {
            showToast('Đã chấp nhận lời mời', 'success');
            loadData(); // Reload to move from requests to friends
        } else {
            showToast(res.error || 'Lỗi', 'error');
        }
    };

    const handleDecline = async (userId: string) => {
        const res = await SocialService.unfollowPlayer(userId); // Decline is same as delete connection
        if (res.success) {
            setRequests(prev => prev.filter(r => r.userId !== userId));
            showToast('Đã từ chối lời mời', 'success');
        }
    };

    if (loading) {
        return (
            <div className="pb-20">
                <div className="flex border-b border-slate-800">
                    <div className="flex-1 py-4 flex justify-center">
                        <div className="h-4 w-20 bg-slate-800 rounded animate-pulse" />
                    </div>
                    <div className="flex-1 py-4 flex justify-center">
                        <div className="h-4 w-20 bg-slate-800 rounded animate-pulse" />
                    </div>
                </div>
                <div className="p-4 space-y-3">
                    <SkeletonListItem />
                    <SkeletonListItem />
                    <SkeletonListItem />
                    <SkeletonListItem />
                </div>
            </div>
        );
    }

    return (
        <div className="pb-20">
            {/* Tabs */}
            <div className="flex border-b border-slate-800">
                <button
                    onClick={() => setActiveTab('friends')}
                    className={`flex-1 py-4 text-sm font-semibold relative ${activeTab === 'friends' ? 'text-lime-400' : 'text-slate-400'
                        }`}
                >
                    Bạn bè ({connections.length})
                    {activeTab === 'friends' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`flex-1 py-4 text-sm font-semibold relative ${activeTab === 'requests' ? 'text-lime-400' : 'text-slate-400'
                        }`}
                >
                    Lời mời
                    {requests.length > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                            {requests.length}
                        </span>
                    )}
                    {activeTab === 'requests' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400" />
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                {activeTab === 'friends' ? (
                    connections.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            Chưa có bạn bè nào. Hãy tìm kiếm thêm bạn mới!
                        </div>
                    ) : (
                        connections.map(conn => (
                            <PlayerCard
                                key={conn.id}
                                player={{
                                    id: conn.userId,
                                    fullName: conn.name,
                                    avatarUrl: conn.avatar,
                                    skillLevel: conn.skillLevel,
                                } as any}
                                onUnfollow={() => handleUnfollow(conn.userId)}
                                variant="connection"
                            />
                        ))
                    )
                ) : (
                    requests.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            Không có lời mời kết bạn nào.
                        </div>
                    ) : (
                        requests.map(req => (
                            <PlayerCard
                                key={req.id}
                                player={{
                                    id: req.userId,
                                    fullName: req.name,
                                    avatarUrl: req.avatar,
                                    skillLevel: req.skillLevel,
                                } as any}
                                onAccept={() => handleAccept(req.id)}
                                onDecline={() => handleDecline(req.userId)}
                                variant="request"
                            />
                        ))
                    )
                )}
            </div>
        </div>
    );
};
