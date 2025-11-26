import { useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Debounce hook for performance optimization
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Throttle hook for scroll/resize events
 */
export function useThrottle<T>(value: T, interval: number): T {
    const [throttledValue, setThrottledValue] = React.useState<T>(value);
    const lastExecuted = useRef<number>(Date.now());

    useEffect(() => {
        if (Date.now() >= lastExecuted.current + interval) {
            lastExecuted.current = Date.now();
            setThrottledValue(value);
        } else {
            const timerId = setTimeout(() => {
                lastExecuted.current = Date.now();
                setThrottledValue(value);
            }, interval);

            return () => clearTimeout(timerId);
        }
    }, [value, interval]);

    return throttledValue;
}

/**
 * Memoized callback with dependencies
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
    callback: T,
    deps: React.DependencyList
): T {
    return useCallback(callback, deps) as T;
}

/**
 * Previous value hook
 */
export function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T>();

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref.current;
}

/**
 * Network status hook
 */
export function useNetworkStatus() {
    const [isOnline, setIsOnline] = React.useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitor(componentName: string) {
    const renderCount = useRef(0);
    const startTime = useRef(performance.now());

    useEffect(() => {
        renderCount.current += 1;
        const endTime = performance.now();
        const renderTime = endTime - startTime.current;

        if (process.env.NODE_ENV === 'development') {
            console.log(`[Performance] ${componentName}:`, {
                renders: renderCount.current,
                lastRenderTime: `${renderTime.toFixed(2)}ms`
            });
        }

        startTime.current = performance.now();
    });
}

/**
 * Prefetch images for better UX
 */
export function usePrefetchImages(urls: string[]) {
    useEffect(() => {
        urls.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    }, [urls]);
}

/**
 * Idle callback hook for non-critical tasks
 */
export function useIdleCallback(callback: () => void, deps: React.DependencyList) {
    useEffect(() => {
        if ('requestIdleCallback' in window) {
            const id = requestIdleCallback(callback);
            return () => cancelIdleCallback(id);
        } else {
            // Fallback for browsers without requestIdleCallback
            const id = setTimeout(callback, 1);
            return () => clearTimeout(id);
        }
    }, deps);
}

/**
 * Media query hook
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = React.useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);

        if (media.matches !== matches) {
            setMatches(media.matches);
        }

        const listener = () => setMatches(media.matches);
        media.addEventListener('change', listener);

        return () => media.removeEventListener('change', listener);
    }, [matches, query]);

    return matches;
}

/**
 * Batch state updates for performance
 */
export function useBatchedState<T>(
    initialState: T
): [T, (updater: (prev: T) => T) => void] {
    const [state, setState] = React.useState<T>(initialState);
    const pendingUpdates = useRef<Array<(prev: T) => T>>([]);
    const rafId = useRef<number>();

    const batchedSetState = useCallback((updater: (prev: T) => T) => {
        pendingUpdates.current.push(updater);

        if (!rafId.current) {
            rafId.current = requestAnimationFrame(() => {
                setState(prev => {
                    let next = prev;
                    pendingUpdates.current.forEach(update => {
                        next = update(next);
                    });
                    pendingUpdates.current = [];
                    rafId.current = undefined;
                    return next;
                });
            });
        }
    }, []);

    return [state, batchedSetState];
}

// Import React at top
import React from 'react';
