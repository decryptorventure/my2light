import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Smartphone, Check } from 'lucide-react';
import { Button } from '../ui/Button';

interface TopUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (amount: number, method: PaymentMethod) => void;
}

type PaymentMethod = 'vnpay' | 'momo';

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

export const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [customAmount, setCustomAmount] = useState('');
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('vnpay');
    const [isProcessing, setIsProcessing] = useState(false);

    const amount = customAmount ? parseInt(customAmount) : selectedAmount;

    const handleConfirm = async () => {
        if (!amount || amount < 10000) return;

        setIsProcessing(true);
        await onConfirm(amount, selectedMethod);
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
                    className="w-full bg-slate-900 rounded-t-3xl pb-safe max-h-[85vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold">Nạp tiền vào ví</h3>
                                <p className="text-sm text-slate-400">Chọn số tiền và phương thức</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-slate-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Preset Amounts */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-400 mb-3">
                                Chọn nhanh số tiền
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {PRESET_AMOUNTS.map((preset) => (
                                    <button
                                        key={preset}
                                        onClick={() => {
                                            setSelectedAmount(preset);
                                            setCustomAmount('');
                                        }}
                                        className={`py-3 rounded-lg text-sm font-bold border-2 transition-all ${selectedAmount === preset && !customAmount
                                                ? 'bg-lime-400 border-lime-400 text-slate-900'
                                                : 'bg-slate-800 border-slate-700 text-white hover:border-slate-600'
                                            }`}
                                    >
                                        {(preset / 1000).toLocaleString()}K
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Amount */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-400 mb-3">
                                Hoặc nhập số tiền khác
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={customAmount}
                                    onChange={(e) => {
                                        setCustomAmount(e.target.value);
                                        setSelectedAmount(null);
                                    }}
                                    placeholder="Nhập số tiền (tối thiểu 10,000đ)"
                                    className="w-full bg-slate-800 text-white rounded-lg px-4 py-3 pr-12 border-2 border-slate-700 focus:border-lime-400 focus:outline-none"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                                    đ
                                </span>
                            </div>
                            {customAmount && parseInt(customAmount) < 10000 && (
                                <p className="text-xs text-red-500 mt-2">Số tiền tối thiểu là 10,000đ</p>
                            )}
                        </div>

                        {/* Payment Method */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-400 mb-3">
                                Phương thức thanh toán
                            </label>
                            <div className="space-y-2">
                                {/* VNPay */}
                                <button
                                    onClick={() => setSelectedMethod('vnpay')}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${selectedMethod === 'vnpay'
                                            ? 'bg-blue-500/10 border-blue-500'
                                            : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                                        }`}
                                >
                                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                        <CreditCard className="text-blue-500" size={24} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-bold text-white">VNPay</p>
                                        <p className="text-xs text-slate-400">Thẻ ATM, Visa, Mastercard</p>
                                    </div>
                                    {selectedMethod === 'vnpay' && (
                                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                            <Check size={16} className="text-white" />
                                        </div>
                                    )}
                                </button>

                                {/* Momo */}
                                <button
                                    onClick={() => setSelectedMethod('momo')}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${selectedMethod === 'momo'
                                            ? 'bg-pink-500/10 border-pink-500'
                                            : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                                        }`}
                                >
                                    <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
                                        <Smartphone className="text-pink-500" size={24} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-bold text-white">Momo</p>
                                        <p className="text-xs text-slate-400">Ví điện tử Momo</p>
                                    </div>
                                    {selectedMethod === 'momo' && (
                                        <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                                            <Check size={16} className="text-white" />
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Summary */}
                        {amount && amount >= 10000 && (
                            <div className="bg-slate-800 rounded-xl p-4 mb-6">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-400">Số tiền nạp</span>
                                    <span className="font-bold text-white">{amount.toLocaleString()}đ</span>
                                </div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-400">Phí giao dịch</span>
                                    <span className="font-bold text-green-500">Miễn phí</span>
                                </div>
                                <div className="border-t border-slate-700 my-2"></div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Tổng cộng</span>
                                    <span className="text-xl font-black text-lime-400">
                                        {amount.toLocaleString()}đ
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={onClose} className="flex-1" disabled={isProcessing}>
                                Hủy
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                className="flex-1"
                                disabled={!amount || amount < 10000 || isProcessing}
                                isLoading={isProcessing}
                            >
                                {isProcessing ? 'Đang xử lý...' : 'Tiếp tục'}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
