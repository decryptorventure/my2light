import { set, get, del, keys, createStore } from 'idb-keyval';

// Create a custom store for video chunks to avoid conflicts with other data
const videoStore = createStore('my2light-video-db', 'video-chunks');
// Use a separate DB for metadata to avoid versioning/schema conflicts with the existing video DB
const metadataStore = createStore('my2light-meta-db', 'session-metadata');

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

export const VideoStorage = {
    // --- Chunk Management ---

    async saveChunk(sessionId: string, chunkId: number, blob: Blob): Promise<void> {
        const key = `${sessionId}_chunk_${chunkId}`;
        const data: VideoChunk = {
            sessionId,
            chunkId,
            blob,
            timestamp: Date.now(),
        };
        await set(key, data, videoStore);
    },

    async getChunk(sessionId: string, chunkId: number): Promise<VideoChunk | undefined> {
        const key = `${sessionId}_chunk_${chunkId}`;
        return await get(key, videoStore);
    },

    async deleteChunk(sessionId: string, chunkId: number): Promise<void> {
        const key = `${sessionId}_chunk_${chunkId}`;
        await del(key, videoStore);
    },

    async getAllChunksForSession(sessionId: string): Promise<VideoChunk[]> {
        const allKeys = await keys(videoStore);
        const sessionKeys = allKeys.filter((k) => (k as string).startsWith(`${sessionId}_chunk_`));

        const chunks: VideoChunk[] = [];
        for (const key of sessionKeys) {
            const chunk = await get(key, videoStore);
            if (chunk) chunks.push(chunk);
        }

        return chunks.sort((a, b) => a.chunkId - b.chunkId);
    },

    async clearSessionChunks(sessionId: string): Promise<void> {
        const allKeys = await keys(videoStore);
        const sessionKeys = allKeys.filter((k) => (k as string).startsWith(`${sessionId}_chunk_`));

        for (const key of sessionKeys) {
            await del(key, videoStore);
        }
    },

    // --- Metadata Management ---

    async saveSessionMetadata(metadata: SessionMetadata): Promise<void> {
        await set(metadata.sessionId, metadata, metadataStore);
    },

    async getSessionMetadata(sessionId: string): Promise<SessionMetadata | undefined> {
        return await get(sessionId, metadataStore);
    },

    async getAllSessions(): Promise<SessionMetadata[]> {
        const allKeys = await keys(metadataStore);
        const sessions: SessionMetadata[] = [];

        for (const key of allKeys) {
            const session = await get(key, metadataStore);
            if (session) sessions.push(session);
        }

        return sessions.sort((a, b) => b.startTime - a.startTime); // Newest first
    },

    async deleteSessionMetadata(sessionId: string): Promise<void> {
        await del(sessionId, metadataStore);
    },

    // --- Cleanup ---

    async clearAllData(): Promise<void> {
        // Be careful with this!
        const vKeys = await keys(videoStore);
        for (const k of vKeys) await del(k, videoStore);

        const mKeys = await keys(metadataStore);
        for (const k of mKeys) await del(k, metadataStore);
    }
};
