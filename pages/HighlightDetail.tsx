import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { highlightsService } from '../src/api';
import { Highlight } from '../types';
import { VideoFeedItem } from '../src/components/video/VideoFeedItem';

export const HighlightDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [loading, setLoading] = useState(true);
    const [initialIndex, setInitialIndex] = useState(0);

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Fetch the specific highlight to ensure we have it
            const singleRes = await highlightsService.getHighlightById(id!);

            // 2. Fetch a list of highlights for the feed (e.g., recent ones)
            // We fetch more to allow scrolling
            const listRes = await highlightsService.getHighlights(20);

            if (singleRes.success && singleRes.data) {
                const targetHighlight = singleRes.data;
                let feedList = listRes.data || [];

                // Remove the target highlight if it exists in the list to avoid duplicates
                feedList = feedList.filter(h => h.id !== targetHighlight.id);

                // Put target highlight at the top
                const finalList = [targetHighlight, ...feedList];

                setHighlights(finalList);
                setInitialIndex(0); // Always start at the top since we prepended it
            } else if (listRes.success && listRes.data) {
                // Fallback if single fetch fails but list works (unlikely)
                setHighlights(listRes.data);
            }
        } catch (error) {
            console.error("Error loading highlights", error);
        } finally {
            setLoading(false);
        }
    };

    const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
    const observer = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        if (highlights.length > 0) {
            // Set initial active video
            setActiveVideoId(highlights[0].id);
        }
    }, [highlights]);

    useEffect(() => {
        observer.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveVideoId(entry.target.getAttribute('data-id'));
                    }
                });
            },
            { threshold: 0.6 }
        );

        return () => observer.current?.disconnect();
    }, []);

    useEffect(() => {
        const elements = document.querySelectorAll('.detail-video-card');
        elements.forEach(el => observer.current?.observe(el));

        return () => {
            // Cleanup is handled by the observer disconnect
        };
    }, [highlights]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-lime-400 animate-spin" />
            </div>
        );
    }

    if (highlights.length === 0) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
                <p>Không tìm thấy highlight</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-lime-400">Quay lại</button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black z-50">
            <div className="absolute top-0 left-0 right-0 z-50 p-4 pt-safe pointer-events-none">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors pointer-events-auto"
                >
                    <ChevronLeft size={20} />
                </button>
            </div>

            {/* Feed Container */}
            <div className="h-screen overflow-y-scroll snap-y snap-mandatory no-scrollbar">
                {highlights.map((item) => (
                    <div
                        key={item.id}
                        data-id={item.id}
                        className="detail-video-card h-screen snap-start w-full"
                    >
                        <VideoFeedItem
                            highlight={item}
                            isActive={activeVideoId === item.id}
                            onBack={() => navigate(-1)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
