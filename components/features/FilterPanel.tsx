import React, { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';

interface FilterPanelProps {
    onApply: (filters: CourtFilters) => void;
    onReset: () => void;
}

export interface CourtFilters {
    sortBy: 'distance' | 'price' | 'rating';
    maxDistance: number;
    minPrice: number;
    maxPrice: number;
    status?: 'available' | 'all';
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ onApply, onReset }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating'>('distance');
    const [maxDistance, setMaxDistance] = useState(10);
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(500000);
    const [status, setStatus] = useState<'available' | 'all'>('all');

    const handleApply = () => {
        onApply({
            sortBy,
            maxDistance,
            minPrice,
            maxPrice,
            status: status === 'all' ? undefined : status,
        });
        setIsOpen(false);
    };

    const handleReset = () => {
        setSortBy('distance');
        setMaxDistance(10);
        setMinPrice(0);
        setMaxPrice(500000);
        setStatus('all');
        onReset();
        setIsOpen(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
            >
                <SlidersHorizontal size={20} />
                <span className="text-sm font-medium">Lọc</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 bg-slate-900 rounded-t-3xl z-[100] pb-safe"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold">Bộ lọc</h3>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-slate-700"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Sort By */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-3">
                                            Sắp xếp theo
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { value: 'distance', label: 'Khoảng cách' },
                                                { value: 'price', label: 'Giá' },
                                                { value: 'rating', label: 'Đánh giá' },
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setSortBy(option.value as any)}
                                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${sortBy === option.value
                                                            ? 'bg-lime-400 text-slate-900'
                                                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Max Distance */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-3">
                                            Khoảng cách tối đa: {maxDistance} km
                                        </label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="20"
                                            value={maxDistance}
                                            onChange={(e) => setMaxDistance(Number(e.target.value))}
                                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-lime-400"
                                        />
                                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                                            <span>1 km</span>
                                            <span>20 km</span>
                                        </div>
                                    </div>

                                    {/* Price Range */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-3">
                                            Khoảng giá: {minPrice.toLocaleString()}đ - {maxPrice.toLocaleString()}đ
                                        </label>
                                        <div className="flex gap-4">
                                            <input
                                                type="range"
                                                min="0"
                                                max="1000000"
                                                step="50000"
                                                value={minPrice}
                                                onChange={(e) => setMinPrice(Number(e.target.value))}
                                                className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-lime-400"
                                            />
                                            <input
                                                type="range"
                                                min="0"
                                                max="1000000"
                                                step="50000"
                                                value={maxPrice}
                                                onChange={(e) => setMaxPrice(Number(e.target.value))}
                                                className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-lime-400"
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                                            <span>0đ</span>
                                            <span>1,000,000đ</span>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-3">
                                            Trạng thái
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { value: 'all', label: 'Tất cả' },
                                                { value: 'available', label: 'Còn trống' },
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setStatus(option.value as any)}
                                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${status === option.value
                                                            ? 'bg-lime-400 text-slate-900'
                                                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-8">
                                    <Button
                                        variant="outline"
                                        onClick={handleReset}
                                        className="flex-1"
                                    >
                                        Đặt lại
                                    </Button>
                                    <Button
                                        onClick={handleApply}
                                        className="flex-1"
                                    >
                                        Áp dụng
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
