import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, UserPlus } from 'lucide-react';
import { SocialService } from '../../services/social';
import { useToast } from '../../components/ui/Toast';

interface ConnectionRequestModalProps {
    targetUserId: string;
    targetUserName: string;
    targetUserAvatar?: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const ConnectionRequestModal: React.FC<ConnectionRequestModalProps> = ({
    targetUserId,
    targetUserName,
    targetUserAvatar,
    isOpen,
    onClose,
    onSuccess
}) => {
    const { showToast } = useToast();
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Note: Currently SocialService.followPlayer doesn't support message, 
        // but we'll implement the UI for it and extend the service later if needed.
        // For now, we just call followPlayer.

        const response = await SocialService.followPlayer(targetUserId);

        if (response.success) {
            showToast(`Đã gửi lời mời kết bạn tới ${targetUserName}`, 'success');
            onSuccess();
            onClose();
        } else {
            showToast(response.error || 'Có lỗi xảy ra', 'error');
        }
        setLoading(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-sm overflow-hidden shadow-2xl"
                        >
                            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                                <h3 className="text-white font-bold text-lg">Kết bạn</h3>
                                <button onClick={onClose} className="text-slate-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 flex flex-col items-center">
                                <div className="w-20 h-20 rounded-full bg-slate-800 overflow-hidden border-2 border-lime-400 mb-4">
                                    {targetUserAvatar ? (
                                        <img src={targetUserAvatar} alt={targetUserName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-500">
                                            {targetUserName.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <h4 className="text-white font-bold text-xl mb-1">{targetUserName}</h4>
                                <p className="text-slate-400 text-sm text-center mb-6">
                                    Gửi lời mời kết bạn để cùng theo dõi hoạt động và giao lưu.
                                </p>

                                <form onSubmit={handleSubmit} className="w-full">
                                    <div className="mb-4">
                                        <label className="block text-slate-400 text-xs font-medium mb-2">
                                            Lời nhắn (tùy chọn)
                                        </label>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Xin chào, mình muốn kết bạn để giao lưu cầu lông..."
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-lime-400 transition-colors h-24 resize-none"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-lime-400 hover:bg-lime-500 text-slate-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <UserPlus size={20} />
                                                <span>Gửi lời mời</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
