import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { ActivityCard } from '../../components/social/ActivityCard';
import { SocialService } from '../../services/social';
import { Activity } from '../../types/social';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { Loader2 } from 'lucide-react';
import { CommentSection } from '../../components/social/CommentSection';
import { PullToRefresh } from '../../components/ui/PullToRefresh';

export const Feed: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        loadFeed();
    }, []);

    const loadFeed = async () => {
        setLoading(true);
        const res = await SocialService.getFeed(1);
        if (res.success && res.data) {
            setActivities(res.data);
            setHasMore(res.data.length === 10);
        } else {
            showToast('Không thể tải bảng tin', 'error');
        }
        setLoading(false);
    };

    const loadMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        const nextPage = page + 1;
        const res = await SocialService.getFeed(nextPage);

        if (res.success && res.data) {
            setActivities(prev => [...prev, ...res.data!]);
            setPage(nextPage);
            setHasMore(res.data.length === 10);
        }
        setLoadingMore(false);
    };

    const handleLike = async (id: string) => {
        // Optimistic update
        setActivities(prev => prev.map(a => {
            if (a.id === id) {
                const isLiked = a.metadata.is_liked;
                return {
                    ...a,
                    metadata: {
                        ...a.metadata,
                        likes_count: (a.metadata.likes_count || 0) + (isLiked ? -1 : 1),
                        is_liked: !isLiked
                    }
                };
            }
            return a;
        }));

        const activity = activities.find(a => a.id === id);
        if (activity?.metadata.is_liked) {
            await SocialService.unlikeHighlight(id); // Note: This assumes activity ID maps to highlight ID for highlight posts
        } else {
            await SocialService.likeHighlight(id);
        }
    };

    const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

    const handleComment = (id: string) => {
        const activity = activities.find(a => a.id === id);
        if (activity?.activity_type === 'highlight_post' && activity.metadata.highlight_id) {
            setActiveCommentId(activity.metadata.highlight_id);
        } else {
            // Future: Support comments on matches/other activities
            showToast('Tính năng bình luận chỉ hỗ trợ cho highlight', 'info');
        }
    };

    const handleShare = (id: string) => {
        console.log('Share:', id);
        // TODO: Open share sheet
        showToast('Tính năng chia sẻ đang phát triển', 'info');
    };

    const handlePress = (id: string) => {
        const activity = activities.find(a => a.id === id);
        if (activity?.activity_type === 'highlight_post' && activity.metadata.highlight_id) {
            navigate(`/highlight/${activity.metadata.highlight_id}`);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 p-4 pb-20">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>
        );
    }

    return (
        <div className="h-screen pb-20 flex flex-col">
            <PullToRefresh onRefresh={loadFeed}>
                {activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center min-h-[50vh]">
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <span className="text-4xl">👋</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Chưa có hoạt động nào</h3>
                        <p className="text-slate-400 max-w-xs">
                            Hãy kết nối với những người chơi khác để xem hoạt động của họ tại đây.
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 h-[calc(100vh-80px)]">
                        <Virtuoso
                            style={{ height: '100%' }}
                            data={activities}
                            endReached={() => {
                                if (hasMore && !loadingMore) {
                                    loadMore();
                                }
                            }}
                            itemContent={(index, activity) => (
                                <div className="pb-4">
                                    <ActivityCard
                                        activity={activity}
                                        onLike={handleLike}
                                        onComment={handleComment}
                                        onShare={handleShare}
                                        onPress={handlePress}
                                    />
                                </div>
                            )}
                            components={{
                                Footer: () => loadingMore ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 size={24} className="animate-spin text-lime-400" />
                                    </div>
                                ) : null
                            }}
                        />
                    </div>
                )}
            </PullToRefresh>

            {/* Comment Section Modal */}
            <CommentSection
                highlightId={activeCommentId || ''}
                isOpen={!!activeCommentId}
                onClose={() => setActiveCommentId(null)}
            />
        </div>
    );
};
