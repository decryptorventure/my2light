import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { NotificationService } from '../../services/notifications';

interface NotificationPermissionPromptProps {
    onPermissionGranted?: () => void;
    onPermissionDenied?: () => void;
}

export const NotificationPermissionPrompt: React.FC<NotificationPermissionPromptProps> = ({
    onPermissionGranted,
    onPermissionDenied,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => {
        // Check if we should show the prompt
        const checkPermission = async () => {
            if (!('Notification' in window)) {
                return; // Browser doesn't support notifications
            }

            // Check if user has already granted or denied permission
            if (Notification.permission === 'default') {
                // Check if user has dismissed the prompt before
                const dismissed = localStorage.getItem('notification-prompt-dismissed');
                if (!dismissed) {
                    // Show prompt after a short delay
                    setTimeout(() => setIsVisible(true), 3000);
                }
            }
        };

        checkPermission();
    }, []);

    const handleAllow = async () => {
        setIsRequesting(true);

        const result = await NotificationService.requestPermission();

        if (result.granted) {
            setIsVisible(false);
            onPermissionGranted?.();

            // Send a test notification
            NotificationService.sendTestNotification(
                'Thông báo đã bật!',
                'Bạn sẽ nhận được nhắc nhở về các trận đấu sắp tới'
            );
        } else {
            setIsVisible(false);
            onPermissionDenied?.();
        }

        setIsRequesting(false);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('notification-prompt-dismissed', 'true');
        onPermissionDenied?.();
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[200]"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-slate-700 relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center hover:bg-slate-600"
                    >
                        <X size={16} />
                    </button>

                    {/* Icon */}
                    <div className="w-16 h-16 bg-lime-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="text-lime-400" size={32} />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-white text-center mb-2">
                        Bật thông báo?
                    </h3>
                    <p className="text-slate-400 text-center mb-6 text-sm">
                        Nhận nhắc nhở về trận đấu sắp tới, cập nhật booking và các thông báo quan trọng khác
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={handleDismiss}
                            className="flex-1"
                            disabled={isRequesting}
                        >
                            Để sau
                        </Button>
                        <Button
                            onClick={handleAllow}
                            className="flex-1"
                            isLoading={isRequesting}
                            disabled={isRequesting}
                        >
                            {isRequesting ? 'Đang xử lý...' : 'Cho phép'}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
