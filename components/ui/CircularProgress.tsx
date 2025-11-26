import React from 'react';
import { motion } from 'framer-motion';

interface CircularProgressProps {
    value: number;
    max: number;
    size?: number;
    strokeWidth?: number;
    label?: string;
    showValue?: boolean;
    color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
    animated?: boolean;
    children?: React.ReactNode;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
    value,
    max,
    size = 120,
    strokeWidth = 8,
    label,
    showValue = true,
    color = 'primary',
    animated = true,
    children
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const colors = {
        primary: {
            stroke: 'var(--color-primary)',
            glow: 'rgba(163, 230, 53, 0.3)'
        },
        success: {
            stroke: 'var(--color-success)',
            glow: 'rgba(34, 197, 94, 0.3)'
        },
        warning: {
            stroke: 'var(--color-warning)',
            glow: 'rgba(245, 158, 11, 0.3)'
        },
        error: {
            stroke: 'var(--color-error)',
            glow: 'rgba(239, 68, 68, 0.3)'
        },
        info: {
            stroke: 'var(--color-info)',
            glow: 'rgba(59, 130, 246, 0.3)'
        }
    };

    const currentColor = colors[color];

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            {/* SVG Circle */}
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="var(--color-surface-elevated)"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={currentColor.stroke}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset }}
                    animate={{ strokeDashoffset }}
                    transition={{
                        duration: 1,
                        ease: 'easeOut',
                        delay: 0.2
                    }}
                    style={{
                        filter: `drop-shadow(0 0 8px ${currentColor.glow})`
                    }}
                />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {children || (
                    <>
                        {showValue && (
                            <motion.div
                                initial={animated ? { scale: 0 } : { scale: 1 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                                className="text-center"
                            >
                                <div className="text-3xl font-black text-white tabular-nums">
                                    {Math.round(percentage)}%
                                </div>
                                {label && (
                                    <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">
                                        {label}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

interface StatCircleProps {
    value: number;
    max?: number;
    label: string;
    icon?: React.ReactNode;
    color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
    size?: number;
    unit?: string;
}

export const StatCircle: React.FC<StatCircleProps> = ({
    value,
    max = 100,
    label,
    icon,
    color = 'primary',
    size = 96,
    unit = ''
}) => {
    return (
        <div className="flex flex-col items-center gap-3">
            <CircularProgress
                value={value}
                max={max}
                size={size}
                color={color}
                showValue={false}
            >
                <div className="flex flex-col items-center justify-center">
                    {icon && <div className="text-lime-400 mb-1">{icon}</div>}
                    <div className="text-2xl font-black text-white tabular-nums">
                        {value}{unit}
                    </div>
                </div>
            </CircularProgress>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold text-center">
                {label}
            </div>
        </div>
    );
};

interface TimerCircleProps {
    totalSeconds: number;
    elapsedSeconds: number;
    size?: number;
    showHours?: boolean;
}

export const TimerCircle: React.FC<TimerCircleProps> = ({
    totalSeconds,
    elapsedSeconds,
    size = 240,
    showHours = true
}) => {
    const remainingSeconds = Math.max(totalSeconds - elapsedSeconds, 0);
    const percentage = (remainingSeconds / totalSeconds) * 100;

    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    const formatTime = () => {
        if (showHours) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const getColor = (): 'primary' | 'warning' | 'error' => {
        if (percentage > 50) return 'primary';
        if (percentage > 20) return 'warning';
        return 'error';
    };

    return (
        <CircularProgress
            value={remainingSeconds}
            max={totalSeconds}
            size={size}
            strokeWidth={12}
            color={getColor()}
            showValue={false}
            animated={false}
        >
            <div className="flex flex-col items-center">
                <div className="text-6xl font-black text-white tabular-nums tracking-tight">
                    {formatTime()}
                </div>
                <div className="text-sm text-slate-400 uppercase tracking-wider mt-2 font-medium">
                    Thời gian còn lại
                </div>
            </div>
        </CircularProgress>
    );
};
