import { useState, useEffect, useCallback, useRef } from 'react';

interface UseCameraProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    autoStart?: boolean;
}

interface CameraState {
    stream: MediaStream | null;
    error: string | null;
    isLoading: boolean;
    permissionGranted: boolean;
    facingMode: 'user' | 'environment';
}

export const useCamera = ({ videoRef, autoStart = true }: UseCameraProps) => {
    const [state, setState] = useState<CameraState>({
        stream: null,
        error: null,
        isLoading: true,
        permissionGranted: false,
        facingMode: 'environment', // Default to back camera for sports
    });

    const streamRef = useRef<MediaStream | null>(null);

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setState(prev => ({ ...prev, stream: null, isLoading: false }));
    }, [videoRef]);

    const startCamera = useCallback(async (facingModeOverride?: 'user' | 'environment') => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        stopStream();

        const targetFacingMode = facingModeOverride || state.facingMode;

        try {
            const constraints = {
                audio: true,
                video: {
                    facingMode: targetFacingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 60 }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Important for iOS Safari
                videoRef.current.setAttribute('playsinline', 'true');
                videoRef.current.play().catch(e => console.error("Error playing video:", e));
            }

            setState(prev => ({
                ...prev,
                stream,
                isLoading: false,
                permissionGranted: true,
                facingMode: targetFacingMode
            }));

        } catch (err: any) {
            console.error("Camera error:", err);
            let errorMessage = "Không thể truy cập camera.";

            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMessage = "Vui lòng cấp quyền truy cập camera và microphone để sử dụng tính năng này.";
            } else if (err.name === 'NotFoundError') {
                errorMessage = "Không tìm thấy camera trên thiết bị này.";
            } else if (err.name === 'NotReadableError') {
                errorMessage = "Camera đang được sử dụng bởi ứng dụng khác.";
            }

            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
                permissionGranted: false
            }));
        }
    }, [state.facingMode, stopStream, videoRef]);

    const switchCamera = useCallback(() => {
        const newMode = state.facingMode === 'user' ? 'environment' : 'user';
        startCamera(newMode);
    }, [state.facingMode, startCamera]);

    useEffect(() => {
        if (autoStart) {
            startCamera();
        }
        return () => {
            stopStream();
        };
    }, [autoStart]); // Only run on mount/unmount if autoStart changes, but startCamera handles cleanup

    return {
        ...state,
        startCamera,
        stopStream,
        switchCamera
    };
};
