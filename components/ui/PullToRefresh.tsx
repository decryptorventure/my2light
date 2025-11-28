import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
    const [startY, setStartY] = useState(0);
    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const controls = useAnimation();

    const THRESHOLD = 80;

    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            if (window.scrollY === 0) {
                setStartY(e.touches[0].clientY);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (startY > 0 && window.scrollY === 0) {
                const currentY = e.touches[0].clientY;
                const diff = currentY - startY;
                if (diff > 0) {
                    // Add resistance
                    setPullDistance(Math.min(diff * 0.5, 120));
                    e.preventDefault(); // Prevent native scroll
                }
            }
        };

        const handleTouchEnd = async () => {
            if (pullDistance > THRESHOLD) {
                setRefreshing(true);
                setPullDistance(THRESHOLD);
                await onRefresh();
                setRefreshing(false);
            }
            setPullDistance(0);
            setStartY(0);
        };

        const element = containerRef.current;
        if (element) {
            element.addEventListener('touchstart', handleTouchStart);
            element.addEventListener('touchmove', handleTouchMove, { passive: false });
            element.addEventListener('touchend', handleTouchEnd);
        }

        return () => {
            if (element) {
                element.removeEventListener('touchstart', handleTouchStart);
                element.removeEventListener('touchmove', handleTouchMove);
                element.removeEventListener('touchend', handleTouchEnd);
            }
        };
    }, [startY, pullDistance, onRefresh]);

    return (
        <div ref={containerRef} className="relative min-h-screen">
            <motion.div
                className="absolute top-0 left-0 right-0 flex justify-center items-center h-20 -mt-20"
                style={{ y: pullDistance }}
            >
                {refreshing ? (
                    <Loader2 className="animate-spin text-lime-400" size={24} />
                ) : (
                    <div
                        className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shadow-lg"
                        style={{
                            transform: `rotate(${pullDistance * 2}deg)`,
                            opacity: pullDistance / THRESHOLD
                        }}
                    >
                        <span className="text-lime-400 text-lg">↓</span>
                    </div>
                )}
            </motion.div>
            <motion.div style={{ y: pullDistance }}>
                {children}
            </motion.div>
        </div>
    );
};
