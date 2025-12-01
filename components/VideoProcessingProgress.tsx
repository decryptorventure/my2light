import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface VideoProcessingProgressProps {
    isProcessing: boolean;
    progress: number;
    stage: string;
    error?: string | null;
    onCancel?: () => void;
    onRetry?: () => void;
}

export const VideoProcessingProgress: React.FC<VideoProcessingProgressProps> = ({
    isProcessing,
    progress,
    stage,
    error,
    onCancel,
    onRetry,
}) => {
    const [eta, setEta] = useState<number>(0);
    const [startTime] = useState<number>(Date.now());

    useEffect(() => {
        if (isProcessing && progress > 0) {
            const elapsed = Date.now() - startTime;
            const estimatedTotal = (elapsed / progress) * 100;
            const remaining = Math.max(0, estimatedTotal - elapsed);
            setEta(Math.round(remaining / 1000));
        }
    }, [progress, isProcessing, startTime]);

    const getStatusColor = () => {
        if (error) return 'red';
        if (progress === 100) return 'green';
        return 'blue';
    };

    const getStatusIcon = () => {
        if (error) return <XCircle className="text-red-500" size={48} />;
        if (progress === 100) return <CheckCircle className="text-green-500" size={48} />;
        return <Loader2 className="text-blue-500 animate-spin" size={48} />;
    };

    if (!isProcessing && !error && progress === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            >
                <Card className="w-full max-w-md p-8 bg-slate-800 border-slate-700">
                    <div className="flex flex-col items-center space-y-6">
                        {/* Icon */}
                        <div className="relative">
                            {getStatusIcon()}
                            {isProcessing && progress < 100 && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">
                                        {progress}%
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Title */}
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-white mb-2">
                                {error
                                    ? 'Lỗi xử lý video'
                                    : progress === 100
                                        ? 'Hoàn thành!'
                                        : 'Đang xử lý video...'}
                            </h3>
                            <p className="text-sm text-slate-400">
                                {error || stage}
                            </p>
                        </div>

                        {/* Progress Bar */}
                        {!error && (
                            <div className="w-full space-y-2">
                                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full ${progress === 100
                                            ? 'bg-green-500'
                                            : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                            }`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>

                                {/* Stats */}
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>{progress}%</span>
                                    {isProcessing && progress < 100 && eta > 0 && (
                                        <span>~{eta}s còn lại</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Processing Stages */}
                        {!error && progress < 100 && (
                            <div className="w-full space-y-2">
                                {[
                                    { name: 'Khởi tạo', threshold: 10 },
                                    { name: 'Tải segments', threshold: 30 },
                                    { name: 'Ghép video', threshold: 90 },
                                    { name: 'Hoàn tất', threshold: 100 },
                                ].map((s, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div
                                            className={`w-2 h-2 rounded-full ${progress >= s.threshold
                                                ? 'bg-green-500'
                                                : progress >= s.threshold - 10
                                                    ? 'bg-blue-500 animate-pulse'
                                                    : 'bg-slate-600'
                                                }`}
                                        />
                                        <span
                                            className={`text-xs ${progress >= s.threshold
                                                ? 'text-green-400'
                                                : progress >= s.threshold - 10
                                                    ? 'text-blue-400'
                                                    : 'text-slate-500'
                                                }`}
                                        >
                                            {s.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 w-full">
                            {error && onRetry && (
                                <Button
                                    onClick={onRetry}
                                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                                >
                                    Thử lại
                                </Button>
                            )}

                            {isProcessing && progress < 100 && onCancel && (
                                <Button
                                    onClick={onCancel}
                                    variant="outline"
                                    className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10"
                                >
                                    Hủy
                                </Button>
                            )}

                            {(error || progress === 100) && (
                                <Button
                                    onClick={() => window.location.reload()}
                                    variant="ghost"
                                    className="flex-1"
                                >
                                    Đóng
                                </Button>
                            )}
                        </div>

                        {/* Browser Notice */}
                        {isProcessing && (
                            <div className="w-full p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <AlertCircle size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-blue-300">
                                        Video đang được xử lý trên thiết bị của bạn.
                                        Vui lòng không đóng tab này.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
};
