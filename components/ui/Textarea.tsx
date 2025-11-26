import React, { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
    variant?: 'default' | 'filled' | 'outline';
    resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, helperText, variant = 'default', resize = 'vertical', className = '', ...props }, ref) => {
        const baseStyles = "w-full px-4 py-3 rounded-xl transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

        const variants = {
            default: "bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20",
            filled: "bg-slate-700 border-0 text-white placeholder:text-slate-400 focus:bg-slate-600",
            outline: "bg-transparent border-2 border-slate-700 text-white placeholder:text-slate-500 focus:border-lime-400"
        };

        const resizeStyles = {
            none: 'resize-none',
            vertical: 'resize-y',
            horizontal: 'resize-x',
            both: 'resize'
        };

        const hasError = Boolean(error);
        const errorStyles = hasError ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "";

        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={`${baseStyles} ${variants[variant]} ${errorStyles} ${resizeStyles[resize]} ${className}`}
                    {...props}
                />
                {error && (
                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p className="mt-1.5 text-xs text-slate-400">{helperText}</p>
                )}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';
