import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock } from 'lucide-react';
import { Button } from '../ui/Button';

interface RescheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (newDate: Date, newTime: string) => void;
    currentBooking: {
        courtName: string;
        date: string;
        time: string;
    };
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    currentBooking,
}) => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Generate next 7 days
    const generateDates = () => {
        const dates = [];
        const today = new Date();
        for (let i = 1; i <= 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    // Generate time slots (06:00 - 22:00)
    const generateTimeSlots = () => {
        const slots = [];
        for (let i = 6; i <= 22; i++) {
            slots.push(`${i.toString().padStart(2, '0')}:00`);
            slots.push(`${i.toString().padStart(2, '0')}:30`);
        }
        return slots;
    };

    const handleConfirm = async () => {
        if (!selectedTime) return;
        setIsProcessing(true);
        await onConfirm(selectedDate, selectedTime);
        setIsProcessing(false);
    };

    if (!isOpen) return null;

    const dates = generateDates();
    const timeSlots = generateTimeSlots();

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
                        <div className="flex items-center justify-between mb-6 sticky top-0 bg-slate-900 pb-4">
                            <div>
                                <h3 className="text-xl font-bold">Đổi lịch đặt sân</h3>
                                <p className="text-sm text-slate-400">Chọn ngày và giờ mới</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-slate-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Current Booking */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
                            <p className="text-xs text-slate-400 mb-2">Lịch hiện tại</p>
                            <div className="space-y-1">
                                <p className="font-bold">{currentBooking.courtName}</p>
                                <p className="text-sm text-slate-300">
                                    {currentBooking.date} • {currentBooking.time}
                                </p>
                            </div>
                        </div>

                        {/* Date Selection */}
                        <div className="mb-6">
                            <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                                <Calendar size={18} className="text-lime-400" />
                                Chọn ngày mới
                            </h4>
                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                {dates.map((date, i) => {
                                    const isSelected = date.toDateString() === selectedDate.toDateString();
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedDate(date)}
                                            className={`flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition-all ${isSelected
                                                    ? 'bg-lime-400 border-lime-400 text-slate-900'
                                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                                }`}
                                        >
                                            <span className="text-xs font-medium uppercase">
                                                {date.toLocaleDateString('vi-VN', { weekday: 'short' })}
                                            </span>
                                            <span className="text-xl font-black">{date.getDate()}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Time Selection */}
                        <div className="mb-6">
                            <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                                <Clock size={18} className="text-blue-400" />
                                Chọn giờ mới
                            </h4>
                            <div className="grid grid-cols-4 gap-2">
                                {timeSlots.map((slot, i) => {
                                    const isDisabled = (i % 5 === 0 || i % 7 === 0) && i !== 0;
                                    const isSelected = selectedTime === slot;

                                    return (
                                        <button
                                            key={i}
                                            disabled={isDisabled}
                                            onClick={() => setSelectedTime(slot)}
                                            className={`py-2 rounded-lg text-sm font-bold border transition-all ${isSelected
                                                    ? 'bg-lime-400 border-lime-400 text-slate-900'
                                                    : isDisabled
                                                        ? 'bg-slate-800/50 border-transparent text-slate-600 cursor-not-allowed line-through'
                                                        : 'bg-slate-800 border-slate-700 text-white hover:border-slate-500'
                                                }`}
                                        >
                                            {slot}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 sticky bottom-0 bg-slate-900 pt-4">
                            <Button variant="outline" onClick={onClose} className="flex-1" disabled={isProcessing}>
                                Hủy
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                className="flex-1"
                                disabled={!selectedTime || isProcessing}
                                isLoading={isProcessing}
                            >
                                {isProcessing ? 'Đang đổi lịch...' : 'Xác nhận đổi lịch'}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
