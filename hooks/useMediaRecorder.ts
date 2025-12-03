import { useState, useRef, useCallback, useEffect } from 'react';
import { VideoStorage, SessionMetadata } from '../lib/storage';
import { isIOSSafari, getBrowserInfo } from '../lib/browserDetect';

interface UseMediaRecorderProps {
    onChunkSaved?: (chunkId: number, size: number) => void;
    onError?: (error: Error) => void;
    onStorageWarning?: (message: string) => void;
}

export interface HighlightEvent {
    id: string;
    timestamp: number; // Relative time in seconds
    label: string;
}

export interface UseMediaRecorderReturn {
    startRecording: (sessionId: string) => Promise<void>;
    stopRecording: () => Promise<void>;
    addHighlight: () => void;
    switchCamera: () => Promise<void>;
    enableStream: () => Promise<void>;
    isRecording: boolean;
    isPaused: boolean;
    duration: number;
    stream: MediaStream | null;
    error: Error | null;
    highlightCount: number;
    highlightEvents: HighlightEvent[];
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
    const [highlightEvents, setHighlightEvents] = useState<HighlightEvent[]>([]);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [isMemoryMode, setIsMemoryMode] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const sessionIdRef = useRef<string | null>(null);
    const chunkIdRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const highlightEventsRef = useRef<HighlightEvent[]>([]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    /**
     * Enable camera stream without recording
     */
    const enableStream = useCallback(async () => {
        try {
            if (stream) return; // Already active

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: true
            });
            setStream(mediaStream);
        } catch (err) {
            console.error('❌ Failed to enable stream:', err);
            setError(err as Error);
            onError?.(err as Error);
        }
    }, [facingMode, stream, onError]);

    /**
     * Start recording with fault-tolerant approach
     */
    const startRecording = useCallback(async (sessionId: string) => {
        try {
            setError(null);

            // STEP 1: Get media stream (Use existing or get new)
            let mediaStream = stream;
            if (!mediaStream) {
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode,
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        frameRate: { ideal: 30 }
                    },
                    audio: true
                });
                setStream(mediaStream);
            }

            sessionIdRef.current = sessionId;
            chunkIdRef.current = 0;
            highlightEventsRef.current = [];
            setHighlightCount(0);
            setHighlightEvents([]);

            // STEP 3: Create MediaRecorder (CRITICAL - must succeed)
            // IMPORTANT: iOS Safari MUST use MP4!
            // Safari can RECORD webm but CANNOT PLAY it back
            const browserInfo = getBrowserInfo();
            console.log('🌐 Browser detected:', browserInfo.name, 'on', browserInfo.os);

            let mimeType = '';
            const isAppleDevice = isIOSSafari();

            // Different codec priority for iOS vs Desktop
            const supportedTypes = isAppleDevice
                ? [
                    'video/mp4;codecs=h264,aac',     // ✅ iOS Safari - MUST use MP4
                    'video/mp4',
                    'video/webm;codecs=vp8,opus',    // Fallback (will record but can't play)
                    'video/webm'
                ]
                : [
                    'video/webm;codecs=vp9,opus',    // 🖥️ Desktop - prefer webm (better quality)
                    'video/webm;codecs=vp8,opus',
                    'video/webm',
                    'video/mp4;codecs=h264,aac',
                    'video/mp4',
                ];

            for (const type of supportedTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    mimeType = type;
                    console.log('✅ Using MediaRecorder mimeType:', type);
                    if (isAppleDevice && type.startsWith('video/mp4')) {
                        console.log('🍎 iOS Safari detected - using MP4 for playback compatibility');
                    }
                    break;
                }
            }

            if (!mimeType) {
                throw new Error('Thiết bị không hỗ trợ ghi video. Vui lòng dùng trình duyệt khác.');
            }

            const recorder = new MediaRecorder(mediaStream!, {
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
                // console.log('[Timer] Update:', elapsed, 'seconds');
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
        if (!mediaRecorderRef.current || !isRecording) return;

        return new Promise<void>((resolve) => {
            const stopHandler = async () => {
                if (timerIntervalRef.current) {
                    clearInterval(timerIntervalRef.current);
                }
                setIsRecording(false);
                setIsPaused(false);

                // Stop all tracks to release camera
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    setStream(null);
                }

                // Update final metadata
                if (sessionIdRef.current) {
                    try {
                        const currentMeta = await VideoStorage.getSessionMetadata(sessionIdRef.current);
                        if (currentMeta) {
                            await VideoStorage.saveSessionMetadata({
                                ...currentMeta,
                                status: 'completed',
                                endTime: Date.now(),
                                highlightEvents: highlightEventsRef.current
                            });
                        }
                    } catch (err) {
                        console.error('Failed to save final metadata:', err);
                    }
                }

                resolve();
            };

            mediaRecorderRef.current!.onstop = stopHandler;
            mediaRecorderRef.current!.stop();
        });
    }, [isRecording, stream]);

    /**
     * Add highlight marker
     */
    const addHighlight = useCallback(() => {
        if (!isRecording) return;

        const timestamp = Math.floor((Date.now() - startTimeRef.current) / 1000);

        // Create new event
        const newEvent: HighlightEvent = {
            id: crypto.randomUUID(),
            timestamp,
            label: `Highlight ${highlightEventsRef.current.length + 1}`
        };

        // Update refs and state
        highlightEventsRef.current.push(newEvent);
        setHighlightEvents(prev => [...prev, newEvent]);
        setHighlightCount(prev => prev + 1);

        console.log('✅ Highlight marked at:', timestamp, 's');

        // Update metadata in storage (non-blocking)
        if (sessionIdRef.current) {
            VideoStorage.getSessionMetadata(sessionIdRef.current).then(meta => {
                if (meta) {
                    VideoStorage.saveSessionMetadata({
                        ...meta,
                        highlightEvents: highlightEventsRef.current
                    });
                }
            }).catch(console.error);
        }
    }, [isRecording]);

    /**
     * Switch camera (Front/Back)
     * Only works when NOT recording
     */
    const switchCamera = useCallback(async () => {
        if (!stream) {
            return; // No stream to switch
        }

        try {
            // 1. Stop current tracks
            stream.getTracks().forEach(track => track.stop());

            // 2. Get new stream with opposite camera
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

            // 3. Update state
            setStream(newStream);
            setFacingMode(newFacingMode);
            console.log('✅ Camera switched to:', newFacingMode);

            // 4. If recording, we MUST restart the MediaRecorder with the new stream
            if (isRecording && mediaRecorderRef.current) {
                console.log('🔄 Restarting recorder for new camera...');

                // Stop old recorder
                if (mediaRecorderRef.current.state !== 'inactive') {
                    mediaRecorderRef.current.stop();
                }

                // Create new recorder
                let mimeType = mediaRecorderRef.current.mimeType; // Reuse same mimeType
                const newRecorder = new MediaRecorder(newStream, {
                    mimeType,
                    videoBitsPerSecond: 2500000
                });

                // Attach same data handler
                newRecorder.ondataavailable = async (event) => {
                    if (event.data && event.data.size > 0) {
                        const currentChunkId = chunkIdRef.current++;
                        try {
                            await VideoStorage.saveChunk(sessionIdRef.current!, currentChunkId, event.data);
                            onChunkSaved?.(currentChunkId, event.data.size);

                            // Update metadata
                            const currentMeta = await VideoStorage.getSessionMetadata(sessionIdRef.current!);
                            if (currentMeta) {
                                await VideoStorage.saveSessionMetadata({
                                    ...currentMeta,
                                    chunkCount: currentChunkId + 1
                                });
                            }
                        } catch (err) {
                            console.error('⚠️ Chunk save error:', err);
                        }
                    }
                };

                // Start new recorder
                newRecorder.start(10000);
                mediaRecorderRef.current = newRecorder;
            }

        } catch (err) {
            console.error('❌ Camera switch failed:', err);
            setError(err as Error);
            onError?.(err as Error);
        }
    }, [isRecording, stream, facingMode, onError, onChunkSaved]);

    return {
        startRecording,
        stopRecording,
        addHighlight,
        switchCamera,
        enableStream,
        isRecording,
        isPaused,
        duration,
        stream,
        error,
        highlightCount,
        highlightEvents,
        facingMode,
        isMemoryMode
    };
};
