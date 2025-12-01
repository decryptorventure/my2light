import { useState, useRef, useCallback, useEffect } from 'react';
import { VideoStorage, SessionMetadata } from '../lib/storage';

interface UseMediaRecorderProps {
    onChunkSaved?: (chunkId: number, size: number) => void;
    onError?: (error: Error) => void;
    onStorageWarning?: (message: string) => void;
}

interface UseMediaRecorderReturn {
    startRecording: (sessionId: string) => Promise<void>;
    stopRecording: () => Promise<void>;
    addHighlight: () => void;
    switchCamera: () => Promise<void>;
    isRecording: boolean;
    isPaused: boolean;
    duration: number;
    stream: MediaStream | null;
    error: Error | null;
    highlightCount: number;
    facingMode: 'user' | 'environment';
    isMemoryMode: boolean;
}

export const useMediaRecorder = ({
    onChunkSaved,
    onError,
    onStorageWarning
}: UseMediaRecorderProps = {}): UseMediaRecorderReturn => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [highlightCount, setHighlightCount] = useState(0);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [isMemoryMode, setIsMemoryMode] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const sessionIdRef = useRef<string | null>(null);
    const chunkIdRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const highlightEventsRef = useRef<number[]>([]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [stream]);

    /**
     * Start recording with fault-tolerant approach
     * Timer and recording work even if storage fails
     */
    const startRecording = useCallback(async (sessionId: string) => {
        try {
            setError(null);

            // STEP 1: Get media stream (CRITICAL - must succeed)
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: true
            });

            // STEP 2: Set stream immediately
            setStream(mediaStream);
            sessionIdRef.current = sessionId;
            chunkIdRef.current = 0;
            highlightEventsRef.current = [];
            setHighlightCount(0);

            // STEP 3: Create MediaRecorder (CRITICAL - must succeed)
            // Fallback chain for cross-browser/device support
            let mimeType = '';
            const supportedTypes = [
                'video/webm;codecs=vp9,opus',    // Chrome/Firefox/Edge - best quality
                'video/webm;codecs=vp8,opus',    // Older Chrome/Firefox
                'video/webm',                     // Basic WebM
                'video/mp4;codecs=h264,aac',     // Safari iOS/macOS
                'video/mp4',                      // Fallback MP4
            ];

            for (const type of supportedTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    mimeType = type;
                    console.log('✅ Using MediaRecorder mimeType:', type);
                    break;
                }
            }

            if (!mimeType) {
                throw new Error('Thiết bị không hỗ trợ ghi video. Vui lòng dùng trình duyệt khác.');
            }

            const recorder = new MediaRecorder(mediaStream, {
                mimeType,
                videoBitsPerSecond: 2500000
            });

            // STEP 4: Setup data handler (saves chunks as they come)
            recorder.ondataavailable = async (event) => {
                if (event.data && event.data.size > 0) {
                    const currentChunkId = chunkIdRef.current++;
                    try {
                        // Save chunk - non-blocking, uses fallback if needed
                        await VideoStorage.saveChunk(sessionId, currentChunkId, event.data);

                        // Check if using memory mode
                        if (VideoStorage.isUsingMemoryMode() && !isMemoryMode) {
                            setIsMemoryMode(true);
                            onStorageWarning?.('IndexedDB unavailable. Using memory storage. Please upload immediately after recording.');
                        }

                        // Update metadata count (non-critical)
                        const currentMeta = await VideoStorage.getSessionMetadata(sessionId);
                        if (currentMeta) {
                            await VideoStorage.saveSessionMetadata({
                                ...currentMeta,
                                chunkCount: currentChunkId + 1
                            });
                        }

                        onChunkSaved?.(currentChunkId, event.data.size);
                    } catch (err) {
                        console.error('⚠️ Chunk save error (non-fatal):', err);
                        // Don't throw - recording continues
                    }
                }
            };

            // STEP 5: Start recording (CRITICAL)
            recorder.start(10000); // 10 second chunks
            mediaRecorderRef.current = recorder;

            // STEP 6: Start UI updates (MUST WORK)
            setIsRecording(true);
            startTimeRef.current = Date.now();

            // Start timer - runs regardless of storage
            timerIntervalRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                console.log('[Timer] Update:', elapsed, 'seconds');
                setDuration(elapsed);
            }, 1000);

            console.log('✅ Recording started successfully, timer interval set');

            // STEP 7: Try to save metadata (NON-CRITICAL - don't block on failure)
            try {
                const metadata: SessionMetadata = {
                    sessionId,
                    startTime: Date.now(),
                    status: 'recording',
                    chunkCount: 0,
                    highlightEvents: []
                };
                await VideoStorage.saveSessionMetadata(metadata);

                // Check storage mode
                if (VideoStorage.isUsingMemoryMode()) {
                    setIsMemoryMode(true);
                    onStorageWarning?.('Using memory storage. Video will be lost if you close the app.');
                }
            } catch (err) {
                console.warn('⚠️ Metadata save failed (non-fatal):', err);
                // Recording still works!
            }

        } catch (err) {
            // ONLY fail on critical errors (camera/mic access, MediaRecorder creation)
            console.error('❌ CRITICAL: Recording start failed:', err);
            setError(err as Error);
            onError?.(err as Error);

            // Cleanup
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
            throw err;
        }
    }, [facingMode, onChunkSaved, onError, onStorageWarning, isMemoryMode, stream]);

    /**
     * Stop recording
     */
    const stopRecording = useCallback(async () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();

            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }

            setIsRecording(false);
            setStream(null);

            // Try to update final metadata (non-critical)
            if (sessionIdRef.current) {
                try {
                    const currentMeta = await VideoStorage.getSessionMetadata(sessionIdRef.current);
                    if (currentMeta) {
                        await VideoStorage.saveSessionMetadata({
                            ...currentMeta,
                            status: 'completed',
                            highlightEvents: highlightEventsRef.current
                        });
                    }
                } catch (err) {
                    console.warn('⚠️ Final metadata update failed:', err);
                }
            }

            console.log('✅ Recording stopped');
        }
    }, [isRecording, stream]);

    /**
     * Mark highlight - works in memory, persists if possible
     */
    const addHighlight = useCallback(() => {
        if (isRecording && sessionIdRef.current) {
            const timestamp = Date.now();

            // ALWAYS update memory (CRITICAL)
            highlightEventsRef.current.push(timestamp);
            setHighlightCount(prev => prev + 1);

            console.log('✅ Highlight marked:', highlightEventsRef.current.length);

            // Try to persist (NON-CRITICAL)
            (async () => {
                try {
                    const currentMeta = await VideoStorage.getSessionMetadata(sessionIdRef.current!);
                    if (currentMeta) {
                        await VideoStorage.saveSessionMetadata({
                            ...currentMeta,
                            highlightEvents: highlightEventsRef.current
                        });
                    }
                } catch (err) {
                    console.warn('⚠️ Highlight persist failed (non-fatal):', err);
                }
            })();
        }
    }, [isRecording]);

    /**
     * Switch camera (front/back)
     * Only works when NOT recording
     */
    const switchCamera = useCallback(async () => {
        if (isRecording) {
            const err = new Error('Cannot switch camera while recording');
            setError(err);
            onError?.(err);
            return;
        }

        if (!stream) {
            return; // No stream to switch
        }

        try {
            // Stop current stream
            stream.getTracks().forEach(track => track.stop());

            // Get new stream with opposite camera
            const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: newFacingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: true
            });

            setStream(newStream);
            setFacingMode(newFacingMode);

            console.log('✅ Camera switched to:', newFacingMode);
        } catch (err) {
            console.error('❌ Camera switch failed:', err);
            setError(err as Error);
            onError?.(err as Error);
        }
    }, [isRecording, stream, facingMode, onError]);

    return {
        startRecording,
        stopRecording,
        addHighlight,
        switchCamera,
        isRecording,
        isPaused,
        duration,
        stream,
        error,
        highlightCount,
        facingMode,
        isMemoryMode
    };
};
