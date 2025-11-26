import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './Card';

interface ActivityDay {
    date: string; // ISO date string
    count: number; // Number of sessions
    duration: number; // Total minutes played
}

interface ActivityHeatmapProps {
    data: ActivityDay[];
    weeks?: number; // Number of weeks to display
    onDayClick?: (day: ActivityDay) => void;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
    data,
    weeks = 12,
    onDayClick
}) => {
    const [hoveredDay, setHoveredDay] = useState<ActivityDay | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    // Calculate max intensity for normalization
    const maxCount = Math.max(...data.map(d => d.count), 1);

    // Get intensity level (0-4) based on count
    const getIntensity = (count: number): number => {
        if (count === 0) return 0;
        const percentage = (count / maxCount) * 100;
        if (percentage <= 25) return 1;
        if (percentage <= 50) return 2;
        if (percentage <= 75) return 3;
        return 4;
    };

    // Get color class based on intensity
    const getColorClass = (intensity: number): string => {
        const colors = [
            'bg-slate-800', // No activity
            'bg-lime-400/20', // Low
            'bg-lime-400/40', // Medium-low
            'bg-lime-400/60', // Medium-high
            'bg-lime-400' // High
        ];
        return colors[intensity];
    };

    // Generate grid data for the last N weeks
    const generateGridData = () => {
        const grid: (ActivityDay | null)[][] = [];
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - (weeks * 7));

        for (let week = 0; week < weeks; week++) {
            const weekData: (ActivityDay | null)[] = [];
            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + (week * 7) + day);

                // Find data for this date
                const dateStr = currentDate.toISOString().split('T')[0];
                const dayData = data.find(d => d.date === dateStr);

                weekData.push(dayData || { date: dateStr, count: 0, duration: 0 });
            }
            grid.push(weekData);
        }
        return grid;
    };

    const gridData = generateGridData();

    const handleMouseEnter = (day: ActivityDay, event: React.MouseEvent) => {
        if (day.count > 0) {
            setHoveredDay(day);
            const rect = event.currentTarget.getBoundingClientRect();
            setTooltipPosition({
                x: rect.left + rect.width / 2,
                y: rect.top - 10
            });
        }
    };

    const handleMouseLeave = () => {
        setHoveredDay(null);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
        }
        return `${mins}m`;
    };

    // Calculate streak
    const calculateStreak = () => {
        let streak = 0;
        const sortedDates = [...data]
            .filter(d => d.count > 0)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (sortedDates.length === 0) return 0;

        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Check if there's activity today or yesterday
        if (sortedDates[0].date !== today && sortedDates[0].date !== yesterdayStr) {
            return 0;
        }

        let currentDate = new Date(sortedDates[0].date);
        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(currentDate);
            prevDate.setDate(prevDate.getDate() - 1);
            const prevDateStr = prevDate.toISOString().split('T')[0];

            if (sortedDates[i].date === prevDateStr) {
                streak++;
                currentDate = prevDate;
            } else {
                break;
            }
        }

        return streak + 1;
    };

    const currentStreak = calculateStreak();

    return (
        <div className="relative">
            <Card className="p-4 bg-slate-800/50 border-slate-700">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Hoạt động ({weeks} Tuần)
                    </h3>
                    {currentStreak > 0 && (
                        <div className="flex items-center gap-1.5 bg-lime-400/10 px-2 py-1 rounded-full border border-lime-400/20">
                            <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                            <span className="text-[10px] text-lime-400 font-bold">
                                {currentStreak} ngày liên tiếp
                            </span>
                        </div>
                    )}
                </div>

                {/* Heatmap Grid */}
                <div className="flex gap-1.5 justify-between">
                    {gridData.map((week, weekIndex) => (
                        <div key={weekIndex} className="flex flex-col gap-1.5">
                            {week.map((day, dayIndex) => {
                                if (!day) return null;
                                const intensity = getIntensity(day.count);
                                const colorClass = getColorClass(intensity);

                                return (
                                    <motion.div
                                        key={`${weekIndex}-${dayIndex}`}
                                        className={`w-3 h-3 rounded-sm cursor-pointer transition-all ${colorClass} ${day.count > 0 ? 'hover:ring-2 hover:ring-lime-400 hover:ring-offset-1 hover:ring-offset-slate-900' : ''
                                            }`}
                                        whileHover={day.count > 0 ? { scale: 1.3 } : {}}
                                        onMouseEnter={(e) => handleMouseEnter(day, e)}
                                        onMouseLeave={handleMouseLeave}
                                        onClick={() => day.count > 0 && onDayClick?.(day)}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700/50">
                    <span className="text-[10px] text-slate-500">Ít</span>
                    <div className="flex gap-1">
                        {[0, 1, 2, 3, 4].map(intensity => (
                            <div
                                key={intensity}
                                className={`w-3 h-3 rounded-sm ${getColorClass(intensity)}`}
                            />
                        ))}
                    </div>
                    <span className="text-[10px] text-slate-500">Nhiều</span>
                </div>
            </Card>

            {/* Tooltip */}
            <AnimatePresence>
                {hoveredDay && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="fixed z-50 pointer-events-none"
                        style={{
                            left: tooltipPosition.x,
                            top: tooltipPosition.y,
                            transform: 'translate(-50%, -100%)'
                        }}
                    >
                        <div className="bg-slate-900 border border-lime-400/30 rounded-lg px-3 py-2 shadow-xl shadow-lime-400/10">
                            <div className="text-xs font-bold text-white mb-0.5">
                                {formatDate(hoveredDay.date)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                                {hoveredDay.count} {hoveredDay.count === 1 ? 'trận' : 'trận'} • {formatDuration(hoveredDay.duration)}
                            </div>
                        </div>
                        {/* Arrow */}
                        <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-slate-900 border-r border-b border-lime-400/30 transform rotate-45" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
