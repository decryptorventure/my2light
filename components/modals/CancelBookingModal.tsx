import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

interface CancelBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason?: string) => void;
    bookingInfo: {
        courtName: string;
        date: string;
        time: string;
        amount: number;
    };
}

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    bookingInfo,
}) => {
    const [reason, setReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleConfirm = async () => {
        setIsProcessing(true);
        await onConfirm(reason || undefined);
        setIsProcessing(false);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end z-[100]"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="w-full bg-slate-900 rounded-t-3xl pb-safe"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="text-red-500" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Hủy đặt sân</h3>
                                    <p className="text-sm text-slate-400">Xác nhận hủy booking</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-slate-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Booking Info */}
                        <div className="bg-slate-800 rounded-xl p-4 mb-6">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Sân</span>
                                    <span className="font-medium">{bookingInfo.courtName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Ngày</span>
                                    <span className="font-medium">{bookingInfo.date}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Giờ</span>
                                    <span className="font-medium">{bookingInfo.time}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-slate-700">
                                    <span className="text-slate-400">Hoàn tiền</span>
                                    <span className="font-bold text-lime-400">
                                        {bookingInfo.amount.toLocaleString()}đ
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Cancellation Reason */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Lý do hủy (tùy chọn)
                            </label>
                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full bg-slate-800 text-white rounded-lg px-4 py-3 border border-slate-700 focus:border-lime-400 focus:outline-none"
                            >
                                <option value="">Chọn lý do...</option>
                                <option value="schedule_conflict">Bận việc đột xuất</option>
                                <option value="weather">Thời tiết xấu</option>
                                <option value="found_better">Tìm được sân khác</option>
                                <option value="not_enough_players">Không đủ người chơi</option>
                                <option value="other">Lý do khác</option>
                            </select>
                        </div>

                        {/* Warning */}
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                            <p className="text-sm text-yellow-500">
                                <strong>Lưu ý:</strong> Số tiền sẽ được hoàn lại vào ví My2Light của bạn trong vòng 24h.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="flex-1"
                                disabled={isProcessing}
                            >
                                Giữ lại
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleConfirm}
                                className="flex-1"
                                isLoading={isProcessing}
                            >
                                {isProcessing ? 'Đang hủy...' : 'Xác nhận hủy'}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
