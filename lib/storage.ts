// VideoStorage with Native IndexedDB + Versioning + Memory Fallback
// Version 2.0 - Production-ready implementation

const DB_VERSION = 3; // Bumped to force schema reset
const VIDEO_DB_NAME = 'my2light-recordings-v3';

const STORES = {
    CHUNKS: 'video-chunks',
    METADATA: 'session-metadata'
};

export interface VideoChunk {
    sessionId: string;
    chunkId: number;
    blob: Blob;
    timestamp: number;
}

export interface SessionMetadata {
    sessionId: string;
    startTime: number;
    status: 'recording' | 'uploading' | 'completed' | 'failed';
    chunkCount: number;
    highlightEvents: number[];
}

class VideoStorageManager {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;
    private memoryChunks = new Map<string, VideoChunk>();
    private memoryMetadata = new Map<string, SessionMetadata>();
    private useMemoryFallback = false;

    /**
     * Initialize IndexedDB with proper versioning
     * Auto-migrates and clears old schemas
     */
    private async init(): Promise<void> {
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open(VIDEO_DB_NAME, DB_VERSION);

                request.onerror = () => {
                    console.error('❌ IndexedDB init failed:', request.error);
                    this.useMemoryFallback = true;
                    resolve(); // Don't reject, use memory fallback
                };

                request.onsuccess = () => {
                    this.db = request.result;
                    console.log('✅ IndexedDB initialized, version', DB_VERSION);
                    resolve();
                };

                request.onupgradeneeded = (event) => {
                    const db = (event.target as IDBOpenDBRequest).result;
                    console.log('🔄 Upgrading IndexedDB from version', event.oldVersion, 'to', DB_VERSION);

                    // Delete all old object stores to prevent conflicts
                    const existingStores = Array.from(db.objectStoreNames);
                    existingStores.forEach(storeName => {
                        db.deleteObjectStore(storeName);
                        console.log('🗑️ Deleted old store:', storeName);
                    });

                    // Create fresh stores
                    db.createObjectStore(STORES.CHUNKS);
                    db.createObjectStore(STORES.METADATA);
                    console.log('✅ Created new stores:', STORES.CHUNKS, STORES.METADATA);
                };
            } catch (error) {
                console.error('❌ IndexedDB not supported:', error);
                this.useMemoryFallback = true;
                resolve();
            }
        });

        return this.initPromise;
    }

    /**
     * Save video chunk with automatic fallback
     */
    async saveChunk(sessionId: string, chunkId: number, blob: Blob): Promise<void> {
        const key = `${sessionId}_chunk_${chunkId}`;
        const data: VideoChunk = {
            sessionId,
            chunkId,
            blob,
            timestamp: Date.now()
        };

        // Try IndexedDB first
        if (!this.useMemoryFallback) {
            try {
                await this.init();

                if (this.db) {
                    await new Promise<void>((resolve, reject) => {
                        const tx = this.db!.transaction(STORES.CHUNKS, 'readwrite');
                        const store = tx.objectStore(STORES.CHUNKS);
                        const request = store.put(data, key);

                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(request.error);
                    });
                    return; // Success!
                }
            } catch (error) {
                console.warn('⚠️ IDB save chunk failed, using memory:', error);
                this.useMemoryFallback = true;
            }
        }

        // Fallback to memory
        this.memoryChunks.set(key, data);
        console.log('💾 Saved chunk to memory:', key);
    }

    async getChunk(sessionId: string, chunkId: number): Promise<VideoChunk | undefined> {
        const key = `${sessionId}_chunk_${chunkId}`;

        // Check memory first
        if (this.memoryChunks.has(key)) {
            return this.memoryChunks.get(key);
        }

        // Try IndexedDB
        if (!this.useMemoryFallback && this.db) {
            try {
                return await new Promise((resolve, reject) => {
                    const tx = this.db!.transaction(STORES.CHUNKS, 'readonly');
                    const store = tx.objectStore(STORES.CHUNKS);
                    const request = store.get(key);

                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            } catch (error) {
                console.warn('⚠️ IDB get chunk failed:', error);
            }
        }

        return undefined;
    }

    async deleteChunk(sessionId: string, chunkId: number): Promise<void> {
        const key = `${sessionId}_chunk_${chunkId}`;

        // Delete from memory
        this.memoryChunks.delete(key);

        // Delete from IDB
        if (!this.useMemoryFallback && this.db) {
            try {
                await new Promise<void>((resolve, reject) => {
                    const tx = this.db!.transaction(STORES.CHUNKS, 'readwrite');
                    const store = tx.objectStore(STORES.CHUNKS);
                    const request = store.delete(key);

                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            } catch (error) {
                console.warn('⚠️ IDB delete chunk failed:', error);
            }
        }
    }

    async getAllChunksForSession(sessionId: string): Promise<VideoChunk[]> {
        const chunks: VideoChunk[] = [];

        // Get from memory first
        this.memoryChunks.forEach((chunk, key) => {
            if (key.startsWith(`${sessionId}_chunk_`)) {
                chunks.push(chunk);
            }
        });

        // Get from IDB if available
        if (!this.useMemoryFallback && this.db) {
            try {
                await this.init();
                const idbChunks = await new Promise<VideoChunk[]>((resolve, reject) => {
                    const tx = this.db!.transaction(STORES.CHUNKS, 'readonly');
                    const store = tx.objectStore(STORES.CHUNKS);
                    const request = store.getAll();

                    request.onsuccess = () => {
                        const all = request.result || [];
                        const filtered = all.filter((chunk: VideoChunk) =>
                            chunk && chunk.sessionId === sessionId
                        );
                        resolve(filtered);
                    };
                    request.onerror = () => reject(request.error);
                });

                // Merge with memory chunks (avoid duplicates)
                idbChunks.forEach(chunk => {
                    if (!chunks.some(c => c.chunkId === chunk.chunkId)) {
                        chunks.push(chunk);
                    }
                });
            } catch (error) {
                console.warn('⚠️ IDB get all chunks failed:', error);
            }
        }

        return chunks.sort((a, b) => a.chunkId - b.chunkId);
    }

    async clearSessionChunks(sessionId: string): Promise<void> {
        // Clear from memory
        const keysToDelete: string[] = [];
        this.memoryChunks.forEach((_, key) => {
            if (key.startsWith(`${sessionId}_chunk_`)) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach(key => this.memoryChunks.delete(key));

        // Clear from IDB
        if (!this.useMemoryFallback && this.db) {
            try {
                const chunks = await this.getAllChunksForSession(sessionId);
                for (const chunk of chunks) {
                    await this.deleteChunk(sessionId, chunk.chunkId);
                }
            } catch (error) {
                console.warn('⚠️ IDB clear session failed:', error);
            }
        }
    }

    // --- Metadata Management ---

    async saveSessionMetadata(metadata: SessionMetadata): Promise<void> {
        // Save to memory first (always)
        this.memoryMetadata.set(metadata.sessionId, metadata);

        // Try to save to IDB as well
        if (!this.useMemoryFallback) {
            try {
                await this.init();

                if (this.db) {
                    await new Promise<void>((resolve, reject) => {
                        const tx = this.db!.transaction(STORES.METADATA, 'readwrite');
                        const store = tx.objectStore(STORES.METADATA);
                        const request = store.put(metadata, metadata.sessionId);

                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(request.error);
                    });
                }
            } catch (error) {
                console.warn('⚠️ IDB save metadata failed, using memory only:', error);
            }
        }
    }

    async getSessionMetadata(sessionId: string): Promise<SessionMetadata | undefined> {
        // Check memory first
        if (this.memoryMetadata.has(sessionId)) {
            return this.memoryMetadata.get(sessionId);
        }

        // Try IDB
        if (!this.useMemoryFallback && this.db) {
            try {
                const result = await new Promise<SessionMetadata | undefined>((resolve, reject) => {
                    const tx = this.db!.transaction(STORES.METADATA, 'readonly');
                    const store = tx.objectStore(STORES.METADATA);
                    const request = store.get(sessionId);

                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });

                if (result) {
                    this.memoryMetadata.set(sessionId, result); // Cache in memory
                }

                return result;
            } catch (error) {
                console.warn('⚠️ IDB get metadata failed:', error);
            }
        }

        return undefined;
    }

    async getAllSessions(): Promise<SessionMetadata[]> {
        const sessions: SessionMetadata[] = [];

        // Get from memory
        this.memoryMetadata.forEach(session => sessions.push(session));

        // Get from IDB
        if (!this.useMemoryFallback && this.db) {
            try {
                await this.init();
                const idbSessions = await new Promise<SessionMetadata[]>((resolve, reject) => {
                    const tx = this.db!.transaction(STORES.METADATA, 'readonly');
                    const store = tx.objectStore(STORES.METADATA);
                    const request = store.getAll();

                    request.onsuccess = () => resolve(request.result || []);
                    request.onerror = () => reject(request.error);
                });

                // Merge (avoid duplicates)
                idbSessions.forEach(session => {
                    if (!sessions.some(s => s.sessionId === session.sessionId)) {
                        sessions.push(session);
                    }
                });
            } catch (error) {
                console.warn('⚠️ IDB get all sessions failed:', error);
            }
        }

        return sessions.sort((a, b) => b.startTime - a.startTime);
    }

    async deleteSessionMetadata(sessionId: string): Promise<void> {
        // Delete from memory
        this.memoryMetadata.delete(sessionId);

        // Delete from IDB
        if (!this.useMemoryFallback && this.db) {
            try {
                await new Promise<void>((resolve, reject) => {
                    const tx = this.db!.transaction(STORES.METADATA, 'readwrite');
                    const store = tx.objectStore(STORES.METADATA);
                    const request = store.delete(sessionId);

                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            } catch (error) {
                console.warn('⚠️ IDB delete metadata failed:', error);
            }
        }
    }

    // --- Cleanup ---

    async clearAllData(): Promise<void> {
        // Clear memory
        this.memoryChunks.clear();
        this.memoryMetadata.clear();

        // Clear IDB
        if (!this.useMemoryFallback && this.db) {
            try {
                const vKeys = await new Promise<IDBValidKey[]>((resolve, reject) => {
                    const tx = this.db!.transaction(STORES.CHUNKS, 'readonly');
                    const store = tx.objectStore(STORES.CHUNKS);
                    const request = store.getAllKeys();

                    request.onsuccess = () => resolve(request.result || []);
                    request.onerror = () => reject(request.error);
                });

                for (const key of vKeys) {
                    await new Promise<void>((resolve) => {
                        const tx = this.db!.transaction(STORES.CHUNKS, 'readwrite');
                        const store = tx.objectStore(STORES.CHUNKS);
                        store.delete(key);
                        tx.oncomplete = () => resolve();
                    });
                }

                const mKeys = await new Promise<IDBValidKey[]>((resolve, reject) => {
                    const tx = this.db!.transaction(STORES.METADATA, 'readonly');
                    const store = tx.objectStore(STORES.METADATA);
                    const request = store.getAllKeys();

                    request.onsuccess = () => resolve(request.result || []);
                    request.onerror = () => reject(request.error);
                });

                for (const key of mKeys) {
                    await new Promise<void>((resolve) => {
                        const tx = this.db!.transaction(STORES.METADATA, 'readwrite');
                        const store = tx.objectStore(STORES.METADATA);
                        store.delete(key);
                        tx.oncomplete = () => resolve();
                    });
                }
            } catch (error) {
                console.warn('⚠️ IDB clear all failed:', error);
            }
        }
    }

    /**
     * Check if currently using memory fallback
     */
    isUsingMemoryMode(): boolean {
        return this.useMemoryFallback;
    }
}

// Export singleton instance
export const VideoStorage = new VideoStorageManager();
