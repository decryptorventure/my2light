import { describe, it, expect } from 'vitest';

// Simple utility to test
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
};

describe('Utils', () => {
    it('formats currency correctly', () => {
        expect(formatCurrency(100000)).toBe('100.000 ₫');
    });

    it('handles zero correctly', () => {
        expect(formatCurrency(0)).toBe('0 ₫');
    });
});
