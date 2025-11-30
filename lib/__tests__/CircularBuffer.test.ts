import { describe, it, expect, beforeEach } from 'vitest';
import { CircularBuffer } from '../CircularBuffer';

describe('CircularBuffer', () => {
    describe('Constructor', () => {
        it('should create a buffer with specified max size', () => {
            const buffer = new CircularBuffer<number>(5);
            expect(buffer.getMaxSize()).toBe(5);
            expect(buffer.getSize()).toBe(0);
        });

        it('should throw error if maxSize is 0', () => {
            expect(() => new CircularBuffer(0)).toThrow('maxSize must be greater than 0');
        });

        it('should throw error if maxSize is negative', () => {
            expect(() => new CircularBuffer(-5)).toThrow('maxSize must be greater than 0');
        });
    });

    describe('add()', () => {
        let buffer: CircularBuffer<number>;

        beforeEach(() => {
            buffer = new CircularBuffer<number>(3);
        });

        it('should add items to empty buffer', () => {
            buffer.add(1);
            expect(buffer.getSize()).toBe(1);
            expect(buffer.getAll()).toEqual([1]);
        });

        it('should add multiple items in order', () => {
            buffer.add(1);
            buffer.add(2);
            buffer.add(3);
            expect(buffer.getSize()).toBe(3);
            expect(buffer.getAll()).toEqual([1, 2, 3]);
        });

        it('should replace oldest item when buffer is full', () => {
            buffer.add(1);
            buffer.add(2);
            buffer.add(3);
            buffer.add(4); // Should replace 1

            expect(buffer.getSize()).toBe(3);
            expect(buffer.getAll()).toEqual([2, 3, 4]);
        });

        it('should continue replacing in FIFO order', () => {
            buffer.add(1);
            buffer.add(2);
            buffer.add(3);
            buffer.add(4); // Replace 1
            buffer.add(5); // Replace 2
            buffer.add(6); // Replace 3

            expect(buffer.getAll()).toEqual([4, 5, 6]);
        });

        it('should handle adding many items (stress test)', () => {
            const largeBuffer = new CircularBuffer<number>(100);

            for (let i = 1; i <= 500; i++) {
                largeBuffer.add(i);
            }

            expect(largeBuffer.getSize()).toBe(100);
            expect(largeBuffer.getAll()[0]).toBe(401); // Oldest
            expect(largeBuffer.getAll()[99]).toBe(500); // Newest
        });
    });

    describe('getAll()', () => {
        it('should return empty array for empty buffer', () => {
            const buffer = new CircularBuffer<number>(5);
            expect(buffer.getAll()).toEqual([]);
        });

        it('should return items in chronological order before buffer is full', () => {
            const buffer = new CircularBuffer<number>(5);
            buffer.add(1);
            buffer.add(2);
            buffer.add(3);
            expect(buffer.getAll()).toEqual([1, 2, 3]);
        });

        it('should return items in chronological order after buffer is full', () => {
            const buffer = new CircularBuffer<number>(3);
            buffer.add(1);
            buffer.add(2);
            buffer.add(3);
            buffer.add(4);
            buffer.add(5);

            // Should have [3, 4, 5] in chronological order
            expect(buffer.getAll()).toEqual([3, 4, 5]);
        });

        it('should not modify internal state', () => {
            const buffer = new CircularBuffer<number>(3);
            buffer.add(1);
            buffer.add(2);

            const items1 = buffer.getAll();
            const items2 = buffer.getAll();

            expect(items1).toEqual(items2);
            expect(items1).not.toBe(items2); // Different array instances
        });
    });

    describe('getLast()', () => {
        let buffer: CircularBuffer<number>;

        beforeEach(() => {
            buffer = new CircularBuffer<number>(5);
            buffer.add(1);
            buffer.add(2);
            buffer.add(3);
            buffer.add(4);
            buffer.add(5);
        });

        it('should get last N items', () => {
            expect(buffer.getLast(2)).toEqual([4, 5]);
            expect(buffer.getLast(3)).toEqual([3, 4, 5]);
        });

        it('should handle getting more items than available', () => {
            const smallBuffer = new CircularBuffer<number>(3);
            smallBuffer.add(1);
            smallBuffer.add(2);

            expect(smallBuffer.getLast(5)).toEqual([1, 2]);
        });

        it('should return empty array if count is 0', () => {
            expect(buffer.getLast(0)).toEqual([]);
        });
    });

    describe('clear()', () => {
        it('should clear all items', () => {
            const buffer = new CircularBuffer<number>(3);
            buffer.add(1);
            buffer.add(2);
            buffer.add(3);

            buffer.clear();

            expect(buffer.getSize()).toBe(0);
            expect(buffer.getAll()).toEqual([]);
            expect(buffer.isBufferFull()).toBe(false);
        });

        it('should allow adding items after clear', () => {
            const buffer = new CircularBuffer<number>(3);
            buffer.add(1);
            buffer.add(2);
            buffer.clear();

            buffer.add(10);
            buffer.add(20);

            expect(buffer.getAll()).toEqual([10, 20]);
        });
    });

    describe('getSize()', () => {
        it('should return 0 for empty buffer', () => {
            const buffer = new CircularBuffer<number>(5);
            expect(buffer.getSize()).toBe(0);
        });

        it('should return current count before buffer is full', () => {
            const buffer = new CircularBuffer<number>(5);
            buffer.add(1);
            expect(buffer.getSize()).toBe(1);
            buffer.add(2);
            expect(buffer.getSize()).toBe(2);
        });

        it('should return max size when buffer is full', () => {
            const buffer = new CircularBuffer<number>(3);
            buffer.add(1);
            buffer.add(2);
            buffer.add(3);
            expect(buffer.getSize()).toBe(3);

            buffer.add(4); // Overflow
            expect(buffer.getSize()).toBe(3); // Still 3
        });
    });

    describe('isBufferFull()', () => {
        it('should return false for empty buffer', () => {
            const buffer = new CircularBuffer<number>(3);
            expect(buffer.isBufferFull()).toBe(false);
        });

        it('should return false before reaching max size', () => {
            const buffer = new CircularBuffer<number>(3);
            buffer.add(1);
            buffer.add(2);
            expect(buffer.isBufferFull()).toBe(false);
        });

        it('should return true when max size is reached', () => {
            const buffer = new CircularBuffer<number>(3);
            buffer.add(1);
            buffer.add(2);
            buffer.add(3);
            expect(buffer.isBufferFull()).toBe(true);
        });

        it('should stay true after overflow', () => {
            const buffer = new CircularBuffer<number>(3);
            buffer.add(1);
            buffer.add(2);
            buffer.add(3);
            buffer.add(4);
            expect(buffer.isBufferFull()).toBe(true);
        });

        it('should return false after clear', () => {
            const buffer = new CircularBuffer<number>(3);
            buffer.add(1);
            buffer.add(2);
            buffer.add(3);
            buffer.clear();
            expect(buffer.isBufferFull()).toBe(false);
        });
    });

    describe('getOldest() and getNewest()', () => {
        it('should return undefined for empty buffer', () => {
            const buffer = new CircularBuffer<number>(3);
            expect(buffer.getOldest()).toBeUndefined();
            expect(buffer.getNewest()).toBeUndefined();
        });

        it('should return correct items before buffer is full', () => {
            const buffer = new CircularBuffer<number>(5);
            buffer.add(1);
            buffer.add(2);
            buffer.add(3);

            expect(buffer.getOldest()).toBe(1);
            expect(buffer.getNewest()).toBe(3);
        });

        it('should return correct items after buffer is full', () => {
            const buffer = new CircularBuffer<number>(3);
            buffer.add(1);
            buffer.add(2);
            buffer.add(3);
            buffer.add(4); // Replaces 1
            buffer.add(5); // Replaces 2

            expect(buffer.getOldest()).toBe(3);
            expect(buffer.getNewest()).toBe(5);
        });

        it('should update correctly as items are added', () => {
            const buffer = new CircularBuffer<number>(3);

            buffer.add(10);
            expect(buffer.getOldest()).toBe(10);
            expect(buffer.getNewest()).toBe(10);

            buffer.add(20);
            expect(buffer.getOldest()).toBe(10);
            expect(buffer.getNewest()).toBe(20);

            buffer.add(30);
            expect(buffer.getOldest()).toBe(10);
            expect(buffer.getNewest()).toBe(30);

            buffer.add(40); // Replaces 10
            expect(buffer.getOldest()).toBe(20);
            expect(buffer.getNewest()).toBe(40);
        });
    });

    describe('getUtilization()', () => {
        it('should return 0 for empty buffer', () => {
            const buffer = new CircularBuffer<number>(10);
            expect(buffer.getUtilization()).toBe(0);
        });

        it('should return correct percentage', () => {
            const buffer = new CircularBuffer<number>(10);

            buffer.add(1);
            expect(buffer.getUtilization()).toBe(10);

            buffer.add(2);
            buffer.add(3);
            buffer.add(4);
            buffer.add(5);
            expect(buffer.getUtilization()).toBe(50);

            for (let i = 6; i <= 10; i++) {
                buffer.add(i);
            }
            expect(buffer.getUtilization()).toBe(100);
        });

        it('should stay at 100% after overflow', () => {
            const buffer = new CircularBuffer<number>(5);
            for (let i = 1; i <= 10; i++) {
                buffer.add(i);
            }
            expect(buffer.getUtilization()).toBe(100);
        });
    });

    describe('getTotalBytes() - Blob specific', () => {
        it('should return 0 for empty buffer', () => {
            const buffer = new CircularBuffer<Blob>();
            expect(buffer.getTotalBytes()).toBe(0);
        });

        it('should calculate total bytes for Blob items', () => {
            const buffer = new CircularBuffer<Blob>(3);

            const blob1 = new Blob(['hello'], { type: 'text/plain' }); // 5 bytes
            const blob2 = new Blob(['world!!!'], { type: 'text/plain' }); // 8 bytes
            const blob3 = new Blob(['test'], { type: 'text/plain' }); // 4 bytes

            buffer.add(blob1);
            buffer.add(blob2);
            buffer.add(blob3);

            expect(buffer.getTotalBytes()).toBe(17); // 5 + 8 + 4
        });

        it('should update total bytes when items are replaced', () => {
            const buffer = new CircularBuffer<Blob>(2);

            const blob1 = new Blob(['1234567890']); // 10 bytes
            const blob2 = new Blob(['12345']); // 5 bytes
            const blob3 = new Blob(['123']); // 3 bytes

            buffer.add(blob1);
            buffer.add(blob2);
            expect(buffer.getTotalBytes()).toBe(15); // 10 + 5

            buffer.add(blob3); // Replaces blob1
            expect(buffer.getTotalBytes()).toBe(8); // 5 + 3
        });
    });

    describe('Edge Cases', () => {
        it('should handle buffer size of 1', () => {
            const buffer = new CircularBuffer<number>(1);

            buffer.add(1);
            expect(buffer.getAll()).toEqual([1]);

            buffer.add(2);
            expect(buffer.getAll()).toEqual([2]);

            buffer.add(3);
            expect(buffer.getAll()).toEqual([3]);
        });

        it('should handle different data types', () => {
            const stringBuffer = new CircularBuffer<string>(3);
            stringBuffer.add('a');
            stringBuffer.add('b');
            stringBuffer.add('c');
            expect(stringBuffer.getAll()).toEqual(['a', 'b', 'c']);

            const objectBuffer = new CircularBuffer<{ id: number }>(2);
            objectBuffer.add({ id: 1 });
            objectBuffer.add({ id: 2 });
            expect(objectBuffer.getAll()).toEqual([{ id: 1 }, { id: 2 }]);
        });

        it('should handle rapid add operations', () => {
            const buffer = new CircularBuffer<number>(10);

            for (let i = 0; i < 1000; i++) {
                buffer.add(i);
            }

            expect(buffer.getSize()).toBe(10);
            expect(buffer.getAll()[0]).toBe(990);
            expect(buffer.getAll()[9]).toBe(999);
        });
    });

    describe('toString()', () => {
        it('should return readable debug string', () => {
            const buffer = new CircularBuffer<number>(5);
            buffer.add(1);
            buffer.add(2);

            const str = buffer.toString();
            expect(str).toContain('size: 2/5');
            expect(str).toContain('full: false');
        });

        it('should show full status when buffer is full', () => {
            const buffer = new CircularBuffer<number>(2);
            buffer.add(1);
            buffer.add(2);

            const str = buffer.toString();
            expect(str).toContain('full: true');
        });
    });
});
