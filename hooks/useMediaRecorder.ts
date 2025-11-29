import { useState, useRef, useCallback, useEffect } from 'react';
import { VideoStorage, SessionMetadata } from '../lib/storage';

interface UseMediaRecorderProps {
    onChunkSaved?: (chunkId: number, size: number) => void;
    onError?: (error: Error) => void;
}

interface UseMediaRecorderReturn {
    startRecording: (sessionId: string, facingMode?: 'user' | 'environment') => Promise<void>;
    stopRecording: () => Promise<void>;
    addHighlight: () => void;
    isRecording: boolean;
    isPaused: boolean;
    duration: number; // in seconds
    stream: MediaStream | null;
    error: Error | null;
    highlightCount: number;
}

export const useMediaRecorder = ({ onChunkSaved, onError }: UseMediaRecorderProps = {}): UseMediaRecorderReturn => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [highlightCount, setHighlightCount] = useState(0);

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

    const startRecording = useCallback(async (sessionId: string, facingMode: 'user' | 'environment' = 'user') => {
        try {
            setError(null);
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
            sessionIdRef.current = sessionId;
            chunkIdRef.current = 0;
            highlightEventsRef.current = [];
            setHighlightCount(0);

            // Initialize metadata
            const metadata: SessionMetadata = {
                sessionId,
                startTime: Date.now(),
                status: 'recording',
                chunkCount: 0,
                highlightEvents: []
            };
            await VideoStorage.saveSessionMetadata(metadata);

            // Better mimeType detection with comprehensive fallback
            const getSupportedMimeType = (): string => {
                const types = [
                    'video/webm;codecs=vp9,opus',
                    'video/webm;codecs=vp8,opus',
                    'video/webm;codecs=vp8',
                    'video/webm',
                    'video/mp4;codecs=h264,aac',
                    'video/mp4'
                ];

                for (const type of types) {
                    if (MediaRecorder.isTypeSupported(type)) {
                        console.log('Using mimeType:', type);
                        return type;
                    }
                }

                // If no types supported, let browser choose default
                console.warn('No explicit mimeType supported, using browser default');
                return '';
            };

            const mimeType = getSupportedMimeType();
            const recorderOptions: MediaRecorderOptions = mimeType
                ? { mimeType, videoBitsPerSecond: 2500000 }
                : { videoBitsPerSecond: 2500000 };

            const recorder = new MediaRecorder(mediaStream, recorderOptions);

            recorder.ondataavailable = async (event) => {
                if (event.data && event.data.size > 0) {
                    const currentChunkId = chunkIdRef.current++;
                    try {
                        await VideoStorage.saveChunk(sessionId, currentChunkId, event.data);

                        // Update metadata chunk count
                        const currentMeta = await VideoStorage.getSessionMetadata(sessionId);
                        if (currentMeta) {
                            await VideoStorage.saveSessionMetadata({
                                ...currentMeta,
                                chunkCount: currentChunkId + 1
                            });
                        }

                        if (onChunkSaved) {
                            onChunkSaved(currentChunkId, event.data.size);
                        }
                    } catch (err) {
                        console.error('Failed to save chunk', err);
                        if (onError) onError(err as Error);
                    }
                }
            };

            recorder.start(10000); // Slice every 10 seconds
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
            startTimeRef.current = Date.now();

            // Start duration timer - FIXED: ensure interval runs properly
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
            timerIntervalRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                setDuration(elapsed);
            }, 1000);

        } catch (err) {
            console.error('Error starting recording:', err);
            setError(err as Error);
            if (onError) onError(err as Error);
        }
    }, [onChunkSaved, onError]);

    const stopRecording = useCallback(async () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }

            setIsRecording(false);
            setStream(null);

            // Update final metadata
            if (sessionIdRef.current) {
                const currentMeta = await VideoStorage.getSessionMetadata(sessionIdRef.current);
                if (currentMeta) {
                    await VideoStorage.saveSessionMetadata({
                        ...currentMeta,
                        status: 'completed',
                        highlightEvents: highlightEventsRef.current
                    });
                }
            }
        }
    }, [isRecording, stream]);

    const addHighlight = useCallback(async () => {
        if (isRecording && sessionIdRef.current) {
            const timestamp = Date.now();
            highlightEventsRef.current.push(timestamp);
            setHighlightCount(prev => prev + 1);

            // Update metadata immediately to be safe
            const currentMeta = await VideoStorage.getSessionMetadata(sessionIdRef.current);
            if (currentMeta) {
                await VideoStorage.saveSessionMetadata({
                    ...currentMeta,
                    highlightEvents: highlightEventsRef.current
                });
            }
        }
    }, [isRecording]);

    return {
        startRecording,
        stopRecording,
        addHighlight,
        isRecording,
        isPaused,
        duration,
        stream,
        error,
        highlightCount
    };
};
