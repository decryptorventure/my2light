import React, { useRef, useEffect, useState, useCallback } from 'react';

interface VirtualScrollProps<T> {
    items: T[];
    itemHeight: number;
    containerHeight: number;
    renderItem: (item: T, index: number) => React.ReactNode;
    overscan?: number;
    className?: string;
}

/**
 * Virtual Scroll component for efficient rendering of large lists
 * Only renders visible items + overscan buffer
 */
export function VirtualScroll<T>({
    items,
    itemHeight,
    containerHeight,
    renderItem,
    overscan = 3,
    className = ''
}: VirtualScrollProps<T>) {
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const totalHeight = items.length * itemHeight;
    const visibleCount = Math.ceil(containerHeight / itemHeight);

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
        items.length - 1,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const visibleItems = items.slice(startIndex, endIndex + 1);
    const offsetY = startIndex * itemHeight;

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    return (
        <div
            ref={containerRef}
            className={`overflow-y-auto ${className}`}
            style={{ height: containerHeight }}
            onScroll={handleScroll}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                <div style={{ transform: `translateY(${offsetY}px)` }}>
                    {visibleItems.map((item, index) => (
                        <div key={startIndex + index} style={{ height: itemHeight }}>
                            {renderItem(item, startIndex + index)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
    elementRef: React.RefObject<Element>,
    options?: IntersectionObserverInit
) {
    const [isIntersecting, setIsIntersecting] = useState(false);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
        }, options);

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [elementRef, options]);

    return isIntersecting;
}

/**
 * Lazy load wrapper component
 */
export const LazyLoad: React.FC<{
    children: React.ReactNode;
    placeholder?: React.ReactNode;
    rootMargin?: string;
    threshold?: number;
    className?: string;
}> = ({
    children,
    placeholder,
    rootMargin = '50px',
    threshold = 0.01,
    className = ''
}) => {
        const ref = useRef<HTMLDivElement>(null);
        const isVisible = useIntersectionObserver(ref, { rootMargin, threshold });
        const [hasLoaded, setHasLoaded] = useState(false);

        useEffect(() => {
            if (isVisible && !hasLoaded) {
                setHasLoaded(true);
            }
        }, [isVisible, hasLoaded]);

        return (
            <div ref={ref} className={className}>
                {hasLoaded ? children : placeholder}
            </div>
        );
    };
