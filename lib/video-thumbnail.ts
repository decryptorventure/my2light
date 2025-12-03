/**
 * Video Thumbnail Generator
 * Extracts thumbnail from video using Canvas API
 */

/**
 * Generate thumbnail from video blob
 * @param videoBlob - Video file as Blob
 * @param timeInSeconds - Time to capture (default: 1 second)
 * @returns Promise<Blob> - Thumbnail as JPEG blob
 */
export async function generateVideoThumbnail(
    videoBlob: Blob,
    timeInSeconds: number = 1
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('Canvas not supported'));
            return;
        }

        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;

        video.onloadedmetadata = () => {
            // Set canvas size to video dimensions
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Seek to specified time
            video.currentTime = Math.min(timeInSeconds, video.duration);
        };

        video.onseeked = () => {
            try {
                // Draw video frame to canvas
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Convert canvas to blob
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to create thumbnail blob'));
                        }

                        // Cleanup
                        URL.revokeObjectURL(video.src);
                    },
                    'image/jpeg',
                    0.8 // 80% quality
                );
            } catch (error) {
                reject(error);
            }
        };

        video.onerror = () => {
            URL.revokeObjectURL(video.src);
            reject(new Error('Failed to load video'));
        };

        // Load video
        video.src = URL.createObjectURL(videoBlob);
    });
}

/**
 * Get video duration
 * @param videoBlob - Video file as Blob
 * @returns Promise<number> - Duration in seconds
 */
export async function getVideoDuration(videoBlob: Blob): Promise<number> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;

        video.onloadedmetadata = () => {
            URL.revokeObjectURL(video.src);
            resolve(video.duration);
        };

        video.onerror = () => {
            URL.revokeObjectURL(video.src);
            reject(new Error('Failed to load video'));
        };

        video.src = URL.createObjectURL(videoBlob);
    });
}

/**
 * Get video dimensions
 * @param videoBlob - Video file as Blob
 * @returns Promise<{width: number, height: number}>
 */
export async function getVideoDimensions(
    videoBlob: Blob
): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;

        video.onloadedmetadata = () => {
            URL.revokeObjectURL(video.src);
            resolve({
                width: video.videoWidth,
                height: video.videoHeight,
            });
        };

        video.onerror = () => {
            URL.revokeObjectURL(video.src);
            reject(new Error('Failed to load video'));
        };

        video.src = URL.createObjectURL(videoBlob);
    });
}

/**
 * Check if video is landscape orientation
 * @param videoBlob - Video file as Blob
 * @returns Promise<boolean> - True if landscape (width > height)
 */
export async function isLandscapeVideo(videoBlob: Blob): Promise<boolean> {
    const { width, height } = await getVideoDimensions(videoBlob);
    return width > height;
}

/**
 * Format duration to MM:SS
 */
export function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
