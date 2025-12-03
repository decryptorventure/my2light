import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();

export const compressVideo = async (file: File | Blob): Promise<Blob> => {
    try {
        // Load ffmpeg if not loaded
        if (!ffmpeg.loaded) {
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
        }

        const inputName = 'input.webm';
        const outputName = 'output.mp4';

        await ffmpeg.writeFile(inputName, await fetchFile(file));

        // Compress: 720p, 24fps, 1.5Mbps bitrate (good balance for mobile)
        // -vf scale=-2:720 : Scale height to 720p, keep aspect ratio (width divisible by 2)
        // -r 24 : 24 fps
        // -b:v 1.5M : Target video bitrate
        // -c:v libx264 : H.264 codec
        // -preset fast : Faster encoding
        await ffmpeg.exec([
            '-i', inputName,
            '-vf', 'scale=-2:720',
            '-r', '24',
            '-b:v', '1.5M',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '26',
            outputName
        ]);

        const data = await ffmpeg.readFile(outputName);
        return new Blob([data as any], { type: 'video/mp4' });
    } catch (error) {
        console.error('Compression failed:', error);
        // Fallback: return original file if compression fails
        return file instanceof Blob ? file : new Blob([file]);
    }
};
