import { useState, useRef, useCallback, useEffect } from 'react';

interface UseMediaRecorderProps {
    stream: MediaStream | null;
    onStop?: (blob: Blob, duration: number) => void;
}

export const useMediaRecorder = ({ stream, onStop }: UseMediaRecorderProps) => {
    const [status, setStatus] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
    const [duration, setDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    const startRecording = useCallback(() => {
        if (!stream) return;

        try {
            // Prefer standard codecs
            const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
                ? { mimeType: 'video/webm;codecs=vp9' }
                : MediaRecorder.isTypeSupported('video/webm')
                    ? { mimeType: 'video/webm' }
                    : { mimeType: 'video/mp4' }; // Safari fallback

            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: options.mimeType });
                const finalDuration = (Date.now() - startTimeRef.current) / 1000;
                if (onStop) {
                    onStop(blob, finalDuration);
                }
                setStatus('stopped');
                stopTimer();
            };

            mediaRecorder.start(1000); // Collect chunks every second
            startTimeRef.current = Date.now();
            setStatus('recording');
            startTimer();

        } catch (error) {
            console.error("Failed to start recording:", error);
        }
    }, [stream, onStop]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
            setStatus('paused');
            stopTimer();
        }
    }, []);

    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            setStatus('recording');
            startTimer();
        }
    }, []);

    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const resetRecording = useCallback(() => {
        setDuration(0);
        setStatus('idle');
        chunksRef.current = [];
    }, []);

    useEffect(() => {
        return () => {
            stopTimer();
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    return {
        status,
        duration,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        resetRecording
    };
};
