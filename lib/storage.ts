import { openDB, deleteDB, DBSchema, IDBPDatabase } from 'idb';

interface My2LightDB extends DBSchema {
    'video-chunks': {
        key: string;
        value: VideoChunk;
    };
    'session-metadata': {
        key: string;
        value: SessionMetadata;
    };
}

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
    highlightEvents: number[]; // Timestamps of user triggers
}

const DB_NAME = 'my2light-video-db';
const DB_VERSION = 2; // Bumped to force migration

let dbInstance: IDBPDatabase<My2LightDB> | null = null;

async function getDB(): Promise<IDBPDatabase<My2LightDB>> {
    if (dbInstance) {
        return dbInstance;
    }

    // Delete old database to ensure clean slate
    try {
        await deleteDB(DB_NAME);
    } catch (e) {
        console.log('No old database to delete');
    }

    dbInstance = await openDB<My2LightDB>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
            console.log(`Upgrading DB from ${oldVersion} to ${newVersion}`);

            // Create object stores if they don't exist
            if (!db.objectStoreNames.contains('video-chunks')) {
                db.createObjectStore('video-chunks');
            }
            if (!db.objectStoreNames.contains('session-metadata')) {
                db.createObjectStore('session-metadata');
            }
        },
    });

    return dbInstance;
}

export const VideoStorage = {
    // --- Chunk Management ---

    async saveChunk(sessionId: string, chunkId: number, blob: Blob): Promise<void> {
        const db = await getDB();
        const key = `${sessionId}_chunk_${chunkId}`;
        const data: VideoChunk = {
            sessionId,
            chunkId,
            blob,
            timestamp: Date.now(),
        };
        await db.put('video-chunks', data, key);
    },

    async getChunk(sessionId: string, chunkId: number): Promise<VideoChunk | undefined> {
        const db = await getDB();
        const key = `${sessionId}_chunk_${chunkId}`;
        return await db.get('video-chunks', key);
    },

    async deleteChunk(sessionId: string, chunkId: number): Promise<void> {
        const db = await getDB();
        const key = `${sessionId}_chunk_${chunkId}`;
        await db.delete('video-chunks', key);
    },

    async getAllChunksForSession(sessionId: string): Promise<VideoChunk[]> {
        const db = await getDB();
        const allKeys = await db.getAllKeys('video-chunks');
        const sessionKeys = allKeys.filter((k) => k.startsWith(`${sessionId}_chunk_`));

        const chunks: VideoChunk[] = [];
        for (const key of sessionKeys) {
            const chunk = await db.get('video-chunks', key);
            if (chunk) chunks.push(chunk);
        }

        return chunks.sort((a, b) => a.chunkId - b.chunkId);
    },

    async clearSessionChunks(sessionId: string): Promise<void> {
        const db = await getDB();
        const allKeys = await db.getAllKeys('video-chunks');
        const sessionKeys = allKeys.filter((k) => k.startsWith(`${sessionId}_chunk_`));

        for (const key of sessionKeys) {
            await db.delete('video-chunks', key);
        }
    },

    // --- Metadata Management ---

    async saveSessionMetadata(metadata: SessionMetadata): Promise<void> {
        const db = await getDB();
        await db.put('session-metadata', metadata, metadata.sessionId);
    },

    async getSessionMetadata(sessionId: string): Promise<SessionMetadata | undefined> {
        const db = await getDB();
        return await db.get('session-metadata', sessionId);
    },

    async getAllSessions(): Promise<SessionMetadata[]> {
        const db = await getDB();
        const allValues = await db.getAll('session-metadata');
        return allValues.sort((a, b) => b.startTime - a.startTime); // Newest first
    },

    async deleteSessionMetadata(sessionId: string): Promise<void> {
        const db = await getDB();
        await db.delete('session-metadata', sessionId);
    },

    // --- Cleanup ---

    async clearAllData(): Promise<void> {
        const db = await getDB();

        // Clear all video chunks
        const vKeys = await db.getAllKeys('video-chunks');
        for (const k of vKeys) {
            await db.delete('video-chunks', k);
        }

        // Clear all metadata
        const mKeys = await db.getAllKeys('session-metadata');
        for (const k of mKeys) {
            await db.delete('session-metadata', k);
        }
    }
};
