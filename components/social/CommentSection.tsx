import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Heart } from 'lucide-react';
import { SocialService } from '../../services/social';
import { HighlightComment } from '../../types/social';
import { useAuthStore } from '../../stores/authStore';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface CommentSectionProps {
    highlightId: string;
    isOpen: boolean;
    onClose: () => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ highlightId, isOpen, onClose }) => {
    const { user } = useAuthStore();
    const [comments, setComments] = useState<HighlightComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && highlightId) {
            loadComments();
        }
    }, [isOpen, highlightId]);

    const loadComments = async () => {
        setLoading(true);
        const response = await SocialService.getComments(highlightId);
        if (response.success && response.data) {
            setComments(response.data);
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || submitting) return;

        setSubmitting(true);
        // Optimistic update
        const tempId = Date.now().toString();
        const optimisticComment: HighlightComment = {
            id: tempId,
            highlightId,
            userId: user?.id || '',
            comment: newComment,
            createdAt: new Date().toISOString(),
            likesCount: 0,
            user: {
                id: user?.id || '',
                full_name: (user as any)?.user_metadata?.full_name || 'Me',
                avatar_url: (user as any)?.user_metadata?.avatar_url || ''
            }
        };

        setComments(prev => [...prev, optimisticComment]);
        setNewComment('');

        const response = await SocialService.addComment(highlightId, newComment);

        if (response.success && response.data) {
            // Replace optimistic comment with real one
            setComments(prev => prev.map(c => c.id === tempId ? response.data! : c));
        } else {
            // Revert on failure
            setComments(prev => prev.filter(c => c.id !== tempId));
            // Show error toast here
        }
        setSubmitting(false);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-slate-900 z-50 rounded-t-2xl border-t border-slate-800 h-[75vh] flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                            <div className="w-8" /> {/* Spacer */}
                            <h3 className="text-white font-bold text-lg">Bình luận</h3>
                            <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : comments.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <p>Chưa có bình luận nào.</p>
                                    <p className="text-sm">Hãy là người đầu tiên bình luận!</p>
                                </div>
                            ) : (
                                comments.map((comment) => (
                                    <div key={comment.id} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-700">
                                            {comment.user?.avatar_url ? (
                                                <img src={comment.user.avatar_url} alt={comment.user.full_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                                                    {comment.user?.full_name?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-white font-semibold text-sm">{comment.user?.full_name}</span>
                                                <span className="text-slate-500 text-xs">
                                                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}
                                                </span>
                                            </div>
                                            <p className="text-slate-300 text-sm mt-0.5 leading-relaxed">{comment.comment}</p>

                                            {/* Actions */}
                                            <div className="flex items-center gap-4 mt-2">
                                                <button className="text-slate-500 text-xs font-medium hover:text-slate-300">Trả lời</button>
                                                {(comment.likesCount || 0) > 0 && (
                                                    <span className="text-slate-500 text-xs">{comment.likesCount} lượt thích</span>
                                                )}
                                            </div>
                                        </div>
                                        <button className="pt-1 text-slate-500 hover:text-red-500 transition-colors">
                                            <Heart size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-3 border-t border-slate-800 bg-slate-900 pb-safe">
                            <form onSubmit={handleSubmit} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-700">
                                    {(user as any)?.user_metadata?.avatar_url ? (
                                        <img src={(user as any).user_metadata.avatar_url} alt="Me" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                                            ME
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Thêm bình luận..."
                                        className="w-full bg-slate-800 text-white text-sm rounded-full py-2.5 pl-4 pr-10 focus:outline-none focus:ring-1 focus:ring-lime-400/50 placeholder:text-slate-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newComment.trim() || submitting}
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-lime-400 text-slate-900 disabled:opacity-0 disabled:scale-75 transition-all"
                                    >
                                        <Send size={14} fill="currentColor" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
