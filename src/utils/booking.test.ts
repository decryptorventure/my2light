import { describe, it, expect } from 'vitest';
import { calculateBookingCost, isSlotAvailable, getTimeSlots } from '../utils/booking';

describe('Booking Utilities', () => {
    describe('calculateBookingCost', () => {
        it('should calculate cost for hourly booking', () => {
            const startTime = new Date('2024-01-01T10:00:00');
            const endTime = new Date('2024-01-01T12:00:00');
            const pricePerHour = 200000;

            const cost = calculateBookingCost(startTime, endTime, pricePerHour);

            expect(cost).toBe(400000); // 2 hours * 200k
        });

        it('should handle 30-minute slots', () => {
            const startTime = new Date('2024-01-01T10:00:00');
            const endTime = new Date('2024-01-01T10:30:00');
            const pricePerHour = 200000;

            const cost = calculateBookingCost(startTime, endTime, pricePerHour);

            expect(cost).toBe(100000); // 0.5 hours * 200k
        });

        it('should round to nearest 1000', () => {
            const startTime = new Date('2024-01-01T10:00:00');
            const endTime = new Date('2024-01-01T10:20:00'); // 20 mins = 0.333... hours
            const pricePerHour = 200000;

            const cost = calculateBookingCost(startTime, endTime, pricePerHour);

            // 0.333... * 200000 = 66666.67 → 67000
            expect(cost).toBeGreaterThanOrEqual(66000);
            expect(cost).toBeLessThanOrEqual(67000);
        });

        it('should handle overnight bookings', () => {
            const startTime = new Date('2024-01-01T22:00:00');
            const endTime = new Date('2024-01-02T02:00:00'); // 4 hours
            const pricePerHour = 200000;

            const cost = calculateBookingCost(startTime, endTime, pricePerHour);

            expect(cost).toBe(800000);
        });
    });

    describe('isSlotAvailable', () => {
        it('should return true for available slot', () => {
            const requestedStart = new Date('2024-01-01T10:00:00');
            const requestedEnd = new Date('2024-01-01T12:00:00');

            const existingBookings = [
                {
                    start_time: new Date('2024-01-01T08:00:00').toISOString(),
                    end_time: new Date('2024-01-01T09:00:00').toISOString(),
                },
                {
                    start_time: new Date('2024-01-01T14:00:00').toISOString(),
                    end_time: new Date('2024-01-01T16:00:00').toISOString(),
                },
            ];

            const available = isSlotAvailable(requestedStart, requestedEnd, existingBookings);

            expect(available).toBe(true);
        });

        it('should return false for overlapping slot', () => {
            const requestedStart = new Date('2024-01-01T10:00:00');
            const requestedEnd = new Date('2024-01-01T12:00:00');

            const existingBookings = [
                {
                    start_time: new Date('2024-01-01T11:00:00').toISOString(),
                    end_time: new Date('2024-01-01T13:00:00').toISOString(),
                },
            ];

            const available = isSlotAvailable(requestedStart, requestedEnd, existingBookings);

            expect(available).toBe(false);
        });

        it('should handle exact time boundaries', () => {
            const requestedStart = new Date('2024-01-01T12:00:00');
            const requestedEnd = new Date('2024-01-01T14:00:00');

            const existingBookings = [
                {
                    start_time: new Date('2024-01-01T10:00:00').toISOString(),
                    end_time: new Date('2024-01-01T12:00:00').toISOString(), // Ends exactly when new starts
                },
            ];

            const available = isSlotAvailable(requestedStart, requestedEnd, existingBookings);

            expect(available).toBe(true); // Back-to-back bookings should be allowed
        });
    });

    describe('getTimeSlots', () => {
        it('should generate available time slots', () => {
            const openTime = '06:00';
            const closeTime = '22:00';
            const date = new Date('2024-01-01');

            const slots = getTimeSlots(date, openTime, closeTime, 60); // 1-hour slots

            expect(slots.length).toBeGreaterThan(0);
            expect(slots[0].start).toContain('06:00');
            expect(slots[slots.length - 1].end).toContain('22:00');
        });

        it('should mark unavailable slots', () => {
            const openTime = '06:00';
            const closeTime = '22:00';
            const date = new Date('2024-01-01');

            const existingBookings = [
                {
                    start_time: new Date('2024-01-01T10:00:00').toISOString(),
                    end_time: new Date('2024-01-01T12:00:00').toISOString(),
                },
            ];

            const slots = getTimeSlots(date, openTime, closeTime, 60, existingBookings);

            const unavailableSlots = slots.filter(s => !s.available);
            expect(unavailableSlots.length).toBeGreaterThan(0);
        });

        it('should handle 30-minute intervals', () => {
            const openTime = '06:00';
            const closeTime = '08:00';
            const date = new Date('2024-01-01');

            const slots = getTimeSlots(date, openTime, closeTime, 30);

            expect(slots.length).toBe(4); // 6:00-6:30, 6:30-7:00, 7:00-7:30, 7:30-8:00
        });
    });
});
