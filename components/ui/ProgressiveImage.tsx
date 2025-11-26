import React, { useState, useEffect } from 'react';
import { Blurhash } from 'react-blurhash';

interface ProgressiveImageProps {
    src: string;
    alt?: string;
    blurhash?: string;
    className?: string;
    aspectRatio?: string;
    onLoad?: () => void;
}

/**
 * Progressive Image component with BlurHash placeholder
 * Provides smooth loading experience with blur-up effect
 */
export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
    src,
    alt = '',
    blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4', // Default blurhash
    className = '',
    aspectRatio = '16/9',
    onLoad
}) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);

    useEffect(() => {
        // Preload image
        const img = new Image();
        img.src = src;

        img.onload = () => {
            setImageSrc(src);
            setImageLoaded(true);
            onLoad?.();
        };

        img.onerror = () => {
            // Fallback to src anyway
            setImageSrc(src);
            setImageLoaded(true);
        };

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [src, onLoad]);

    return (
        <div
            className={`relative overflow-hidden ${className}`}
            style={{ aspectRatio }}
        >
            {/* BlurHash placeholder */}
            {!imageLoaded && (
                <Blurhash
                    hash={blurhash}
                    width="100%"
                    height="100%"
                    resolutionX={32}
                    resolutionY={32}
                    punch={1}
                    className="absolute inset-0"
                />
            )}

            {/* Actual image */}
            {imageSrc && (
                <img
                    src={imageSrc}
                    alt={alt}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                    loading="lazy"
                />
            )}

            {/* Loading overlay */}
            {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
};

/**
 * Optimized Avatar component with lazy loading
 */
export const OptimizedAvatar: React.FC<{
    src: string;
    alt?: string;
    size?: number;
    className?: string;
}> = ({ src, alt = '', size = 40, className = '' }) => {
    const [loaded, setLoaded] = useState(false);

    return (
        <div
            className={`relative rounded-full overflow-hidden bg-slate-800 ${className}`}
            style={{ width: size, height: size }}
        >
            {!loaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 animate-pulse" />
            )}
            <img
                src={src}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'
                    }`}
                onLoad={() => setLoaded(true)}
                loading="lazy"
            />
        </div>
    );
};

/**
 * Thumbnail with progressive loading
 */
export const OptimizedThumbnail: React.FC<{
    src: string;
    alt?: string;
    className?: string;
    onClick?: () => void;
}> = ({ src, alt = '', className = '', onClick }) => {
    const [loaded, setLoaded] = useState(false);

    return (
        <div
            className={`relative overflow-hidden bg-slate-800 ${className}`}
            onClick={onClick}
        >
            {!loaded && (
                <div className="absolute inset-0">
                    <div className="w-full h-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 animate-pulse" />
                </div>
            )}
            <img
                src={src}
                alt={alt}
                className={`w-full h-full object-cover transition-all duration-500 ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                    }`}
                onLoad={() => setLoaded(true)}
                loading="lazy"
            />
        </div>
    );
};
