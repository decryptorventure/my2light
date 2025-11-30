/**
 * Circular Buffer (Ring Buffer) Data Structure
 * 
 * Purpose: Store video chunks in a fixed-size circular buffer
 * When buffer is full, oldest chunk is automatically removed
 * 
 * Use case: Keep last N seconds of video in memory for retroactive recording
 * 
 * @example
 * const buffer = new CircularBuffer(30); // 30 chunks = ~30 seconds
 * buffer.add(videoChunk1);
 * buffer.add(videoChunk2);
 * // ... add 30 chunks
 * buffer.add(videoChunk31); // Chunk 1 is automatically removed
 * 
 * const allChunks = buffer.getAll(); // Get all 30 chunks
 */

export class CircularBuffer<T = Blob> {
    private chunks: T[] = [];
    private maxSize: number;
    private currentIndex: number = 0;
    private isFull: boolean = false;

    /**
     * Create a circular buffer
     * @param maxSize Maximum number of items to store
     */
    constructor(maxSize: number) {
        if (maxSize <= 0) {
            throw new Error('CircularBuffer: maxSize must be greater than 0');
        }
        this.maxSize = maxSize;
    }

    /**
     * Add an item to the buffer
     * If buffer is full, oldest item is automatically replaced
     * 
     * @param item Item to add
     */
    add(item: T): void {
        if (this.isFull) {
            // Buffer is full, replace oldest item
            this.chunks[this.currentIndex] = item;
        } else {
            // Buffer not full yet, append
            this.chunks.push(item);
        }

        // Move to next position
        this.currentIndex = (this.currentIndex + 1) % this.maxSize;

        // Check if we've filled the buffer for the first time
        if (!this.isFull && this.chunks.length >= this.maxSize) {
            this.isFull = true;
        }
    }

    /**
     * Get all items in chronological order (oldest to newest)
     * 
     * @returns Array of items in order they were added
     */
    getAll(): T[] {
        if (!this.isFull) {
            // Buffer not full yet, return in order
            return [...this.chunks];
        }

        // Buffer is full, need to reorder from oldest to newest
        // Oldest item is at currentIndex, newest is at currentIndex - 1
        const result: T[] = [];

        for (let i = 0; i < this.maxSize; i++) {
            const index = (this.currentIndex + i) % this.maxSize;
            result.push(this.chunks[index]);
        }

        return result;
    }

    /**
     * Get the last N items
     * 
     * @param count Number of recent items to get
     * @returns Array of last N items
     */
    getLast(count: number): T[] {
        const all = this.getAll();
        return all.slice(-count);
    }

    /**
     * Clear all items from buffer
     */
    clear(): void {
        this.chunks = [];
        this.currentIndex = 0;
        this.isFull = false;
    }

    /**
     * Get current number of items in buffer
     * 
     * @returns Number of items currently stored
     */
    getSize(): number {
        return this.chunks.length;
    }

    /**
     * Get maximum capacity of buffer
     * 
     * @returns Maximum number of items
     */
    getMaxSize(): number {
        return this.maxSize;
    }

    /**
     * Check if buffer is full
     * 
     * @returns True if buffer has reached max capacity
     */
    isBufferFull(): boolean {
        return this.isFull;
    }

    /**
     * Get total bytes of all items (only works with Blob items)
     * 
     * @returns Total size in bytes
     */
    getTotalBytes(): number {
        return this.chunks.reduce((sum, chunk) => {
            if (chunk instanceof Blob) {
                return sum + chunk.size;
            }
            return sum;
        }, 0);
    }

    /**
     * Get buffer utilization percentage
     * 
     * @returns Percentage (0-100) of buffer filled
     */
    getUtilization(): number {
        return (this.chunks.length / this.maxSize) * 100;
    }

    /**
     * Get oldest item without removing it
     * 
     * @returns Oldest item or undefined if empty
     */
    getOldest(): T | undefined {
        if (this.chunks.length === 0) return undefined;

        if (!this.isFull) {
            return this.chunks[0];
        }

        return this.chunks[this.currentIndex];
    }

    /**
     * Get newest item without removing it
     * 
     * @returns Newest item or undefined if empty
     */
    getNewest(): T | undefined {
        if (this.chunks.length === 0) return undefined;

        if (!this.isFull) {
            return this.chunks[this.chunks.length - 1];
        }

        const newestIndex = (this.currentIndex - 1 + this.maxSize) % this.maxSize;
        return this.chunks[newestIndex];
    }

    /**
     * Convert buffer state to string for debugging
     * 
     * @returns Debug string representation
     */
    toString(): string {
        return `CircularBuffer(size: ${this.getSize()}/${this.maxSize}, full: ${this.isFull}, index: ${this.currentIndex})`;
    }
}
