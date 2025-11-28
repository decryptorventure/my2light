import { describe, it, expect } from 'vitest';

describe('Validation Utilities', () => {
    describe('validateEmail', () => {
        it('should accept valid emails', () => {
            expect(validateEmail('test@example.com')).toBe(true);
            expect(validateEmail('user.name@domain.co.uk')).toBe(true);
            expect(validateEmail('test+tag@example.com')).toBe(true);
        });

        it('should reject invalid emails', () => {
            expect(validateEmail('invalid')).toBe(false);
            expect(validateEmail('missing@domain')).toBe(false);
            expect(validateEmail('@nodomain.com')).toBe(false);
            expect(validateEmail('no@domain@test.com')).toBe(false);
        });

        it('should handle edge cases', () => {
            expect(validateEmail('')).toBe(false);
            expect(validateEmail(null as any)).toBe(false);
            expect(validateEmail(undefined as any)).toBe(false);
        });
    });

    describe('validatePhone', () => {
        it('should accept valid Vietnamese phone numbers', () => {
            expect(validatePhone('0123456789')).toBe(true);
            expect(validatePhone('0987654321')).toBe(true);
            expect(validatePhone('+84123456789')).toBe(true);
        });

        it('should reject invalid phone numbers', () => {
            expect(validatePhone('123')).toBe(false);
            expect(validatePhone('abc1234567')).toBe(false);
            expect(validatePhone('')).toBe(false);
        });
    });

    describe('validatePassword', () => {
        it('should require minimum length', () => {
            expect(validatePassword('short')).toBe(false);
            expect(validatePassword('longenough')).toBe(true);
        });

        it('should check strength', () => {
            const result = getPasswordStrength('password123');
            expect(result.score).toBeGreaterThan(0);
            expect(result.score).toBeLessThanOrEqual(5);
        });

        it('should require mix of chars for strong password', () => {
            const weak = getPasswordStrength('password');
            const strong = getPasswordStrength('Password123!');
            expect(strong.score).toBeGreaterThan(weak.score);
        });
    });

    describe('validateCreditAmount', () => {
        it('should accept valid amounts', () => {
            expect(validateCreditAmount(50000)).toBe(true);
            expect(validateCreditAmount(100000)).toBe(true);
            expect(validateCreditAmount(1000000)).toBe(true);
        });

        it('should reject invalid amounts', () => {
            expect(validateCreditAmount(0)).toBe(false);
            expect(validateCreditAmount(-1000)).toBe(false);
            expect(validateCreditAmount(100)).toBe(false); // Too small
        });

        it('should have maximum limit', () => {
            expect(validateCreditAmount(10000000)).toBe(true);
            expect(validateCreditAmount(100000000)).toBe(false); // Too large
        });
    });
});

// Validation functions
function validateEmail(email: string | null | undefined): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone: string): boolean {
    if (!phone) return false;
    const phoneRegex = /^(\+84|0)[0-9]{9,10}$/;
    return phoneRegex.test(phone);
}

function validatePassword(password: string): boolean {
    return password.length >= 8;
}

function getPasswordStrength(password: string): { score: number; feedback: string } {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const feedback = score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong';

    return { score, feedback };
}

function validateCreditAmount(amount: number): boolean {
    const MIN = 10000;
    const MAX = 10000000;
    return amount >= MIN && amount <= MAX;
}
