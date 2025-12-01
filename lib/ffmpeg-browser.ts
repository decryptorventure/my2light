import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

/**
 * Browser-side video processing using FFmpeg.wasm
 * Zero server cost, runs entirely in user's browser
 */

let ffmpegInstance: FFmpeg | null = null;

/**
 * Initialize FFmpeg instance (lazy loading)
 */
export async function loadFFmpeg(
    onProgress?: (progress: number) => void
): Promise<FFmpeg> {
    if (ffmpegInstance) return ffmpegInstance;

    const ffmpeg = new FFmpeg();

    // Setup logging
    ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg]', message);
    });

    // Setup progress tracking
    ffmpeg.on('progress', ({ progress, time }) => {
        const percentage = Math.round(progress * 100);
        console.log(`Processing: ${percentage}% (${time}ms)`);
        onProgress?.(percentage);
    });

    try {
        // Load FFmpeg core from CDN
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });

        ffmpegInstance = ffmpeg;
        console.log('✅ FFmpeg loaded successfully');
        return ffmpeg;
    } catch (error) {
        console.error('❌ Failed to load FFmpeg:', error);
        throw new Error('Không thể khởi tạo FFmpeg. Vui lòng thử lại.');
    }
}

/**
 * Merge multiple video segments into one video
 */
export async function mergeVideos(
    segments: Blob[],
    options: {
        onProgress?: (progress: number, stage: string) => void;
        quality?: 'high' | 'medium' | 'low';
        outputFormat?: 'mp4' | 'webm';
    } = {}
): Promise<Blob> {
    const {
        onProgress,
        quality = 'medium',
        outputFormat = 'mp4',
    } = options;

    try {
        onProgress?.(0, 'Đang khởi tạo FFmpeg...');

        // Load FFmpeg
        const ffmpeg = await loadFFmpeg((p) => {
            onProgress?.(p, 'Đang xử lý video...');
        });

        onProgress?.(10, 'Đang chuẩn bị video segments...');

        // Write segments to virtual filesystem
        const inputFiles: string[] = [];
        for (let i = 0; i < segments.length; i++) {
            const fileName = `segment${i}.webm`;
            await ffmpeg.writeFile(fileName, await fetchFile(segments[i]));
            inputFiles.push(fileName);

            const writeProgress = 10 + ((i + 1) / segments.length) * 20;
            onProgress?.(writeProgress, `Đã tải segment ${i + 1}/${segments.length}`);
        }

        // Create concat demuxer file
        const concatContent = inputFiles
            .map(file => `file '${file}'`)
            .join('\n');
        await ffmpeg.writeFile('concat.txt', concatContent);

        onProgress?.(35, 'Đang ghép và nén video...');

        // Quality settings
        const qualitySettings = {
            high: { crf: '23', preset: 'medium' },
            medium: { crf: '28', preset: 'fast' },
            low: { crf: '32', preset: 'ultrafast' },
        };
        const { crf, preset } = qualitySettings[quality];

        // Execute FFmpeg merge
        const outputFile = `output.${outputFormat}`;
        await ffmpeg.exec([
            '-f', 'concat',
            '-safe', '0',
            '-i', 'concat.txt',
            '-c:v', 'libx264',
            '-preset', preset,
            '-crf', crf,
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart', // Optimize for web playback
            outputFile,
        ]);

        onProgress?.(90, 'Đang hoàn tất...');

        // Read output file
        const data = await ffmpeg.readFile(outputFile);
        // @ts-ignore - FFmpeg FileData type compatibility
        const blob = new Blob([data.buffer || data], {
            type: outputFormat === 'mp4' ? 'video/mp4' : 'video/webm'
        });

        // Cleanup virtual filesystem
        for (const file of [...inputFiles, 'concat.txt', outputFile]) {
            try {
                await ffmpeg.deleteFile(file);
            } catch (e) {
                // Ignore cleanup errors
            }
        }

        onProgress?.(100, 'Hoàn thành!');
        console.log(`✅ Merged ${segments.length} segments into ${outputFile}`);

        return blob;
    } catch (error: any) {
        console.error('❌ Video merge failed:', error);
        throw new Error(
            error.message || 'Không thể ghép video. Vui lòng thử lại.'
        );
    }
}

/**
 * Generate thumbnail from video
 */
export async function generateThumbnail(
    videoBlob: Blob,
    timeInSeconds: number = 1
): Promise<Blob> {
    try {
        const ffmpeg = await loadFFmpeg();

        await ffmpeg.writeFile('input.mp4', await fetchFile(videoBlob));

        await ffmpeg.exec([
            '-i', 'input.mp4',
            '-ss', timeInSeconds.toString(),
            '-vframes', '1',
            '-vf', 'scale=480:-1',
            '-q:v', '2',
            'thumbnail.jpg',
        ]);

        const data = await ffmpeg.readFile('thumbnail.jpg');
        // @ts-ignore - FFmpeg FileData type compatibility
        const blob = new Blob([data.buffer || data], { type: 'image/jpeg' });

        // Cleanup
        await ffmpeg.deleteFile('input.mp4');
        await ffmpeg.deleteFile('thumbnail.jpg');

        return blob;
    } catch (error) {
        console.error('❌ Thumbnail generation failed:', error);
        throw new Error('Không thể tạo thumbnail');
    }
}

/**
 * Get video duration
 */
export async function getVideoDuration(videoBlob: Blob): Promise<number> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
            URL.revokeObjectURL(video.src);
            resolve(video.duration);
        };

        video.onerror = () => {
            URL.revokeObjectURL(video.src);
            reject(new Error('Không thể đọc video'));
        };

        video.src = URL.createObjectURL(videoBlob);
    });
}

/**
 * Check if browser supports FFmpeg.wasm
 */
export function isFFmpegSupported(): boolean {
    try {
        // Check for SharedArrayBuffer support (required by FFmpeg.wasm)
        return typeof SharedArrayBuffer !== 'undefined';
    } catch {
        return false;
    }
}

/**
 * Cleanup FFmpeg instance
 */
export async function cleanupFFmpeg(): Promise<void> {
    if (ffmpegInstance) {
        // FFmpeg.wasm doesn't have explicit cleanup, but we can null the instance
        ffmpegInstance = null;
        console.log('✅ FFmpeg instance cleaned up');
    }
}
