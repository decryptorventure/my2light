import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';
import type { Metric } from 'web-vitals';
import * as Sentry from '@sentry/react';

interface PerformanceMetric extends Metric {
    timestamp: number;
    url: string;
    connection?: string;
}

export function initWebVitals() {
    const sendMetric = (metric: Metric) => {
        const performanceMetric: PerformanceMetric = {
            ...metric,
            timestamp: Date.now(),
            url: window.location.pathname,
            connection: (navigator as any).connection?.effectiveType,
        };

        // Log to console in development
        if (import.meta.env.MODE === 'development') {
            console.log(`[Web Vital] ${metric.name}:`, {
                value: metric.value,
                rating: metric.rating,
                delta: metric.delta,
            });
        }

        // Send to Sentry
        Sentry.captureMessage(`Web Vital: ${metric.name}`, {
            level: metric.rating === 'good' ? 'info' : metric.rating === 'needs-improvement' ? 'warning' : 'error',
            tags: {
                metric_name: metric.name,
                metric_rating: metric.rating,
                page: window.location.pathname,
            },
            contexts: {
                metric: {
                    value: metric.value,
                    delta: metric.delta,
                    id: metric.id,
                    navigationType: metric.navigationType,
                },
            },
        });

        // Send to analytics endpoint
        if (import.meta.env.MODE === 'production') {
            fetch('/api/metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(performanceMetric),
                keepalive: true,
            }).catch(err => {
                console.error('Failed to send metric:', err);
            });
        }

        // Alert on poor performance
        if (metric.rating === 'poor') {
            console.warn(`⚠️ Poor ${metric.name}: ${metric.value}ms`);

            if (import.meta.env.MODE === 'production' &&
                (metric.name === 'LCP' || metric.name === 'INP')) {
                Sentry.captureMessage(`Poor ${metric.name} detected`, {
                    level: 'warning',
                    tags: { performance_issue: true },
                });
            }
        }
    };

    // Track all Core Web Vitals
    // Note: INP (Interaction to Next Paint) replaced FID in March 2024
    onCLS(sendMetric);
    onINP(sendMetric);
    onLCP(sendMetric);
    onFCP(sendMetric);
    onTTFB(sendMetric);
}

// Custom performance marks
export const performanceMark = {
    start: (label: string) => {
        performance.mark(`${label}-start`);
    },

    end: (label: string) => {
        const startMark = `${label}-start`;
        const endMark = `${label}-end`;

        performance.mark(endMark);

        try {
            performance.measure(label, startMark, endMark);
            const measure = performance.getEntriesByName(label)[0];

            if (measure) {
                const duration = measure.duration;

                if (import.meta.env.MODE === 'development') {
                    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
                }

                if (duration > 1000) {
                    Sentry.captureMessage(`Slow operation: ${label}`, {
                        level: 'warning',
                        tags: { performance_issue: true, operation: label },
                        contexts: {
                            performance: {
                                duration,
                                threshold: 1000,
                            },
                        },
                    });
                }

                return duration;
            }
        } catch (error) {
            console.error('Performance measurement failed:', error);
        }

        performance.clearMarks(startMark);
        performance.clearMarks(endMark);
        performance.clearMeasures(label);
    },
};

export function trackApiCall(endpoint: string, duration: number, status: number) {
    const metric = {
        endpoint,
        duration,
        status,
        timestamp: Date.now(),
    };

    if (duration > 500) {
        console.warn(`⚠️ Slow API call to ${endpoint}: ${duration}ms`);

        Sentry.captureMessage(`Slow API call: ${endpoint}`, {
            level: 'warning',
            tags: {
                api_performance: true,
                endpoint,
                status: status.toString(),
            },
            contexts: {
                api: {
                    duration,
                    threshold: 500,
                },
            },
        });
    }

    if (import.meta.env.MODE === 'production') {
        fetch('/api/metrics/api-calls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(metric),
            keepalive: true,
        }).catch(err => console.error('Failed to track API call:', err));
    }
}

export function getDeviceInfo() {
    return {
        userAgent: navigator.userAgent,
        deviceMemory: (navigator as any).deviceMemory || 'unknown',
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
        connection: (navigator as any).connection?.effectiveType || 'unknown',
        downlink: (navigator as any).connection?.downlink || 'unknown',
        rtt: (navigator as any).connection?.rtt || 'unknown',
        saveData: (navigator as any).connection?.saveData || false,
    };
}
