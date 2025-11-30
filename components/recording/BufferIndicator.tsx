import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Clock, HardDrive, CircleDot } from 'lucide-react';

interface BufferIndicatorProps {
    /** Is buffering active */
    isBuffering: boolean;

    /** Buffer duration in seconds */
    duration: number;

    /** Current number of chunks */
    chunkCount: number;

    /** Memory usage in bytes */
    memoryUsage: number;

    /** Optional: Show detailed stats */
    showDetails?: boolean;
}

/**
 * Buffer Indicator Component
 * 
 * Displays real-time ring buffer status for video recording
 * Shows buffering state, duration, chunk count, and memory usage
 * 
 * @example
 * <BufferIndicator
 *   isBuffering={true}
 *   duration={30}
 *   chunkCount={25}
 *   memoryUsage={52428800}
 *   showDetails={true}
 * />
 */
export const BufferIndicator: React.FC<BufferIndicatorProps> = ({
    isBuffering,
    duration,
    chunkCount,
    memoryUsage,
    showDetails = false,
}) => {
    // Calculate memory in MB
    const memoryMB = (memoryUsage / 1024 / 1024).toFixed(1);

    // Calculate buffer percentage
    const bufferPercentage = Math.min((chunkCount / duration) * 100, 100);

    return (
        <AnimatePresence>
            {isBuffering && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="fixed top-20 right-4 z-50"
                >
                    {/* Compact View */}
                    {!showDetails && (
                        <div className="bg-slate-800 border border-lime-400/50 rounded-xl p-3 shadow-xl backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                {/* Pulsing indicator */}
                                <div className="relative">
                                    <div className="w-3 h-3 bg-lime-400 rounded-full animate-pulse" />
                                    <div className="absolute inset-0 w-3 h-3 bg-lime-400 rounded-full animate-ping opacity-75" />
                                </div>

                                {/* Status text */}
                                <div className="flex flex-col">
                                    <span className="text-white text-sm font-bold">
                                        Buffering
                                    </span>
                                    <span className="text-lime-400 text-xs font-mono">
                                        {chunkCount}s ready
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Detailed View */}
                    {showDetails && (
                        <div className="bg-slate-800 border border-lime-400/50 rounded-xl shadow-xl backdrop-blur-md overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-lime-400/10 to-green-400/10 px-4 py-3 border-b border-slate-700">
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <CircleDot size={16} className="text-lime-400 animate-pulse" />
                                    </div>
                                    <span className="text-white text-sm font-bold">
                                        Ring Buffer Active
                                    </span>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="p-4 space-y-3">
                                {/* Buffer Duration */}
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                        <Clock size={16} className="text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-slate-400 text-xs mb-1">Buffer Duration</div>
                                        <div className="text-white font-bold">
                                            {chunkCount}s / {duration}s
                                        </div>
                                        {/* Progress bar */}
                                        <div className="w-full h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-blue-400 to-lime-400 rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${bufferPercentage}%` }}
                                                transition={{ duration: 0.5 }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Chunk Count */}
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                        <Database size={16} className="text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-slate-400 text-xs mb-1">Chunks Stored</div>
                                        <div className="text-white font-bold font-mono">
                                            {chunkCount} chunks
                                        </div>
                                    </div>
                                </div>

                                {/* Memory Usage */}
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                                        <HardDrive size={16} className="text-yellow-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-slate-400 text-xs mb-1">Memory Usage</div>
                                        <div className="text-white font-bold font-mono">
                                            {memoryMB} MB
                                        </div>
                                        {/* Memory indicator */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${parseFloat(memoryMB) > 80
                                                            ? 'bg-red-500'
                                                            : parseFloat(memoryMB) > 50
                                                                ? 'bg-yellow-500'
                                                                : 'bg-green-500'
                                                        }`}
                                                    style={{ width: `${Math.min((parseFloat(memoryMB) / 100) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-slate-400">
                                                {parseFloat(memoryMB) > 80 ? 'High' : parseFloat(memoryMB) > 50 ? 'Med' : 'Low'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Ready indicator */}
                                <div className="pt-3 border-t border-slate-700">
                                    <div className="flex items-center gap-2 text-xs">
                                        <div className="w-2 h-2 bg-lime-400 rounded-full" />
                                        <span className="text-lime-400 font-medium">
                                            Ready to capture last {chunkCount}s
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

/**
 * Mini Buffer Indicator (for mobile/compact view)
 */
export const MiniBufferIndicator: React.FC<Pick<BufferIndicatorProps, 'isBuffering' | 'chunkCount'>> = ({
    isBuffering,
    chunkCount,
}) => {
    return (
        <AnimatePresence>
            {isBuffering && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-lime-400/10 border border-lime-400/30 rounded-full"
                >
                    <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse" />
                    <span className="text-lime-400 text-xs font-bold">
                        {chunkCount}s buffered
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
