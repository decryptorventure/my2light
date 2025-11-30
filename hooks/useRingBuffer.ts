import { useState, useRef, useCallback } from 'react';
import { CircularBuffer } from '../lib/CircularBuffer';

/**
 * Ring Buffer Hook for Video Recording
 * 
 * Purpose: Continuously buffer video in memory (circular buffer)
 * allowing retroactive highlight capture (save past N seconds)
 * 
 * @param bufferDurationSeconds How many seconds to keep in buffer (default: 30)
 * @returns Hook interface with recording controls
 * 
 * @example
 * const { 
 *   startBuffering, 
 *   captureHighlight, 
 *   stopBuffering,
 *   isBuffering 
 * } = useRingBuffer(30);
 * 
 * // Start buffering
 * await startBuffering(mediaStream);
 * 
 * // When user presses "Highlight"
 * const highlightBlob = await captureHighlight(5); // Past 30s + future 5s
 */

export interface RingBufferHookReturn {
    /** Start buffering from media stream */
    startBuffering: (stream: MediaStream) => Promise<void>;

    /** Stop buffering and cleanup */
    stopBuffering: () => void;

    /** Capture highlight from buffer + continue for X seconds */
    captureHighlight: (continueForSeconds?: number) => Promise<Blob | null>;

    /** Is currently buffering */
    isBuffering: boolean;

    /** Current number of chunks in buffer */
    bufferSize: number;

    /** Total memory used by buffer (bytes) */
    memoryUsage: number;

    /** Buffer duration in seconds */
    bufferDuration: number;
}

export const useRingBuffer = (
    bufferDurationSeconds: number = 30
): RingBufferHookReturn => {
    // State
    const [isBuffering, setIsBuffering] = useState(false);
    const [bufferSize, setBufferSize] = useState(0);
    const [memoryUsage, setMemoryUsage] = useState(0);

    // Refs (persisted across renders)
    const bufferRef = useRef<CircularBuffer<Blob>>(
        new CircularBuffer<Blob>(bufferDurationSeconds)
    );
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunkIntervalRef = useRef<number>(1000); // 1 second chunks

    /**
     * Start buffering from media stream
     */
    const startBuffering = useCallback(async (stream: MediaStream): Promise<void> => {
        try {
            console.log('[RingBuffer] Starting buffering...');

            // Check if MediaRecorder is supported
            if (!window.MediaRecorder) {
                throw new Error('MediaRecorder not supported in this browser');
            }

            // Determine best MIME type
            const mimeType = getSupportedMimeType();
            console.log('[RingBuffer] Using MIME type:', mimeType);

            // Create MediaRecorder
            const recorder = new MediaRecorder(stream, {
                mimeType,
                videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality
            });

            // Handle data available (chunks)
            recorder.ondataavailable = (event: BlobEvent) => {
                if (event.data && event.data.size > 0) {
                    // Add chunk to buffer (oldest automatically removed if full)
                    bufferRef.current.add(event.data);

                    // Update state
                    setBufferSize(bufferRef.current.getSize());
                    setMemoryUsage(bufferRef.current.getTotalBytes());

                    console.log('[RingBuffer] Chunk added:', {
                        size: event.data.size,
                        totalChunks: bufferRef.current.getSize(),
                        totalMemory: `${(bufferRef.current.getTotalBytes() / 1024 / 1024).toFixed(1)} MB`
                    });
                }
            };

            // Handle errors
            recorder.onerror = (event: Event) => {
                console.error('[RingBuffer] MediaRecorder error:', event);
                stopBuffering();
            };

            // Handle stop
            recorder.onstop = () => {
                console.log('[RingBuffer] MediaRecorder stopped');
            };

            // Start recording with 1-second chunks
            recorder.start(chunkIntervalRef.current);

            // Store refs
            mediaRecorderRef.current = recorder;
            streamRef.current = stream;
            setIsBuffering(true);

            console.log('[RingBuffer] Buffering started successfully');
        } catch (error) {
            console.error('[RingBuffer] Failed to start buffering:', error);
            setIsBuffering(false);
            throw error;
        }
    }, []);

    /**
     * Capture highlight: buffer content + continue recording for X seconds
     */
    const captureHighlight = useCallback(async (
        continueForSeconds: number = 5
    ): Promise<Blob | null> => {
        if (!mediaRecorderRef.current || !isBuffering) {
            console.warn('[RingBuffer] Cannot capture - not buffering');
            return null;
        }

        try {
            console.log('[RingBuffer] Capturing highlight...');

            // Get all chunks from buffer (past 30 seconds)
            const bufferChunks = bufferRef.current.getAll();
            console.log('[RingBuffer] Buffer chunks:', bufferChunks.length);

            // Continue recording for additional seconds
            const futureChunks: Blob[] = [];
            let secondsCaptured = 0;

            return new Promise<Blob>((resolve, reject) => {
                const captureTimeout = setTimeout(() => {
                    cleanup();
                    reject(new Error('Capture timeout'));
                }, (continueForSeconds + 5) * 1000); // Safety timeout

                const cleanup = () => {
                    clearTimeout(captureTimeout);
                    if (mediaRecorderRef.current) {
                        mediaRecorderRef.current.removeEventListener('dataavailable', captureHandler);
                    }
                };

                const captureHandler = (event: BlobEvent) => {
                    if (event.data && event.data.size > 0) {
                        futureChunks.push(event.data);
                        secondsCaptured++;

                        console.log('[RingBuffer] Future chunk captured:', {
                            chunk: secondsCaptured,
                            target: continueForSeconds,
                            size: event.data.size
                        });

                        // Check if we've captured enough future chunks
                        if (secondsCaptured >= continueForSeconds) {
                            cleanup();

                            // Merge all chunks (buffer + future)
                            const allChunks = [...bufferChunks, ...futureChunks];
                            const mimeType = getSupportedMimeType();
                            const highlightBlob = new Blob(allChunks, { type: mimeType });

                            console.log('[RingBuffer] Highlight captured successfully:', {
                                pastChunks: bufferChunks.length,
                                futureChunks: futureChunks.length,
                                totalChunks: allChunks.length,
                                totalSize: `${(highlightBlob.size / 1024 / 1024).toFixed(1)} MB`,
                                duration: `~${allChunks.length}s`
                            });

                            resolve(highlightBlob);
                        }
                    }
                };

                // Listen for future chunks
                mediaRecorderRef.current?.addEventListener('dataavailable', captureHandler);
            });
        } catch (error) {
            console.error('[RingBuffer] Failed to capture highlight:', error);
            return null;
        }
    }, [isBuffering]);

    /**
     * Stop buffering and cleanup
     */
    const stopBuffering = useCallback(() => {
        console.log('[RingBuffer] Stopping buffering...');

        // Stop MediaRecorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try {
                mediaRecorderRef.current.stop();
            } catch (error) {
                console.warn('[RingBuffer] Error stopping MediaRecorder:', error);
            }
        }

        // Stop all tracks in stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log('[RingBuffer] Stopped track:', track.kind);
            });
        }

        // Clear buffer
        bufferRef.current.clear();

        // Reset refs
        mediaRecorderRef.current = null;
        streamRef.current = null;

        // Reset state
        setIsBuffering(false);
        setBufferSize(0);
        setMemoryUsage(0);

        console.log('[RingBuffer] Buffering stopped and cleaned up');
    }, []);

    return {
        startBuffering,
        stopBuffering,
        captureHighlight,
        isBuffering,
        bufferSize,
        memoryUsage,
        bufferDuration: bufferDurationSeconds,
    };
};

/**
 * Get best supported MIME type for video recording
 */
function getSupportedMimeType(): string {
    const types = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm',
        'video/mp4',
    ];

    for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
            return type;
        }
    }

    // Fallback
    return 'video/webm';
}
