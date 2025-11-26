import React from 'react';
import { motion } from 'framer-motion';

interface SwitchProps {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export const Switch: React.FC<SwitchProps> = ({
    checked,
    onCheckedChange,
    label,
    disabled = false,
    size = 'md'
}) => {
    const sizes = {
        sm: { track: 'w-9 h-5', thumb: 'w-4 h-4', translate: 'translate-x-4' },
        md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
        lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', translate: 'translate-x-7' }
    };

    const currentSize = sizes[size];

    return (
        <div className="flex items-center gap-3">
            <button
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => !disabled && onCheckedChange(!checked)}
                className={`${currentSize.track} relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed ${checked ? 'bg-lime-400' : 'bg-slate-700'
                    }`}
            >
                <motion.span
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`${currentSize.thumb} inline-block rounded-full shadow-lg transform transition-transform duration-200 ${checked ? `${currentSize.translate} bg-slate-900` : 'translate-x-0.5 bg-white'
                        }`}
                />
            </button>
            {label && (
                <label className={`text-sm font-medium select-none ${disabled ? 'text-slate-500' : 'text-slate-300'}`}>
                    {label}
                </label>
            )}
        </div>
    );
};
