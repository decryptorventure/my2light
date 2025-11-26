import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'glass';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  isLoading?: boolean;
  haptic?: boolean; // Enable haptic feedback
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

// Haptic feedback utility
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 50
    };
    navigator.vibrate(patterns[type]);
  }
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading,
  haptic = true, // Default enabled
  icon,
  iconPosition = 'left',
  children,
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles = "relative font-semibold rounded-xl flex items-center justify-center gap-2 transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

  const variants = {
    primary: "bg-lime-400 text-slate-900 hover:bg-lime-300 shadow-[0_0_15px_rgba(163,230,53,0.3)] hover:shadow-[0_0_25px_rgba(163,230,53,0.4)] font-bold",
    secondary: "bg-slate-700 text-white hover:bg-slate-600 border border-slate-600 hover:border-slate-500",
    outline: "border-2 border-slate-600 text-slate-200 hover:border-lime-400 hover:text-lime-400 hover:bg-lime-400/5",
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/50",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 hover:shadow-red-500/30 font-bold",
    success: "bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 font-bold",
    glass: "bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-white/20"
  };

  const sizes = {
    xs: "px-2.5 py-1.5 text-xs min-h-[24px]",
    sm: "px-3 py-2 text-sm min-h-[32px]",
    md: "px-4 py-3 text-sm min-h-[40px]",
    lg: "px-6 py-4 text-base min-h-[48px]",
    xl: "px-8 py-5 text-lg w-full min-h-[56px]",
    icon: "p-2.5 min-h-[40px] min-w-[40px]"
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (haptic) {
      triggerHaptic('medium');
    }
    onClick?.(e);
  };

  const LoadingSpinner = () => (
    <svg
      className="animate-spin h-5 w-5 text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
        </>
      )}
    </motion.button>
  );
};
