import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDuration, formatDistance } from '../utils/format';

describe('Format Utilities', () => {
    describe('formatCurrency', () => {
        it('should format Vietnamese currency correctly', () => {
            expect(formatCurrency(100000)).toBe('100.000đ');
            expect(formatCurrency(1000000)).toBe('1.000.000đ');
            expect(formatCurrency(50000)).toBe('50.000đ');
        });

        it('should handle zero', () => {
            expect(formatCurrency(0)).toBe('0đ');
        });

        it('should handle negative numbers', () => {
            expect(formatCurrency(-100000)).toBe('-100.000đ');
        });

        it('should handle decimals by rounding', () => {
            expect(formatCurrency(100000.5)).toBe('100.001đ');
            expect(formatCurrency(100000.4)).toBe('100.000đ');
        });

        it('should handle very large numbers', () => {
            expect(formatCurrency(1000000000)).toBe('1.000.000.000đ');
        });

        it('should handle null/undefined gracefully', () => {
            expect(formatCurrency(null as any)).toBe('0đ');
            expect(formatCurrency(undefined as any)).toBe('0đ');
        });
    });

    describe('formatDuration', () => {
        it('should format seconds correctly', () => {
            expect(formatDuration(30)).toBe('0:30');
            expect(formatDuration(5)).toBe('0:05');
            expect(formatDuration(59)).toBe('0:59');
        });

        it('should format minutes and seconds', () => {
            expect(formatDuration(60)).toBe('1:00');
            expect(formatDuration(90)).toBe('1:30');
            expect(formatDuration(125)).toBe('2:05');
        });

        it('should format hours, minutes, seconds', () => {
            expect(formatDuration(3600)).toBe('1:00:00');
            expect(formatDuration(3665)).toBe('1:01:05');
            expect(formatDuration(7200)).toBe('2:00:00');
        });

        it('should handle zero', () => {
            expect(formatDuration(0)).toBe('0:00');
        });

        it('should handle negative numbers', () => {
            expect(formatDuration(-30)).toBe('0:00');
        });

        it('should pad single digit minutes and seconds', () => {
            expect(formatDuration(65)).toBe('1:05');
            expect(formatDuration(605)).toBe('10:05');
        });
    });

    describe('formatDistance', () => {
        it('should format meters correctly', () => {
            expect(formatDistance(500)).toBe('500m');
            expect(formatDistance(999)).toBe('999m');
        });

        it('should format kilometers correctly', () => {
            expect(formatDistance(1000)).toBe('1.0km');
            expect(formatDistance(1500)).toBe('1.5km');
            expect(formatDistance(2300)).toBe('2.3km');
        });

        it('should round to 1 decimal place', () => {
            expect(formatDistance(1234)).toBe('1.2km');
            expect(formatDistance(1567)).toBe('1.6km');
        });

        it('should handle zero', () => {
            expect(formatDistance(0)).toBe('0m');
        });

        it('should handle very large distances', () => {
            expect(formatDistance(100000)).toBe('100.0km');
        });

        it('should handle null/undefined', () => {
            expect(formatDistance(null as any)).toBe('0m');
            expect(formatDistance(undefined as any)).toBe('0m');
        });
    });
});
