import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  variant?: 'default' | 'elevated' | 'glass' | 'gradient' | 'outline';
  interactive?: boolean; // Adds hover/focus states
  shimmer?: boolean; // Loading shimmer effect
  glow?: boolean; // Glow on hover
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  variant = 'default',
  interactive = false,
  shimmer = false,
  glow = false,
  onClick,
  ...props
}) => {
  const baseStyles = "rounded-2xl overflow-hidden transition-all duration-300";

  const variants = {
    default: "bg-slate-800/50 border border-slate-700",
    elevated: "bg-slate-800 border border-slate-700 shadow-xl",
    glass: "glass", // Uses utility class from index.css
    gradient: "gradient-surface border border-slate-700",
    outline: "bg-transparent border-2 border-slate-700"
  };

  const interactiveStyles = interactive || onClick ? "cursor-pointer hover:border-lime-400/30 hover:shadow-lg hover:shadow-lime-400/10 active:scale-[0.99]" : "";
  const shimmerStyles = shimmer ? "shimmer" : "";
  const glowStyles = glow ? "hover:shadow-glow-primary" : "";
  const hoverStyles = hoverEffect ? "hover:scale-[1.02] hover:shadow-xl" : "";

  const Component = onClick || interactive ? motion.div : 'div';
  const isMotion = onClick || interactive;

  return (
    <>
      {isMotion ? (
        <motion.div
          className={`${baseStyles} ${variants[variant]} ${interactiveStyles} ${shimmerStyles} ${glowStyles} ${hoverStyles} ${className}`}
          onClick={onClick}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          {...props}
        >
          {children}
        </motion.div>
      ) : (
        <div
          className={`${baseStyles} ${variants[variant]} ${interactiveStyles} ${shimmerStyles} ${glowStyles} ${hoverStyles} ${className}`}
          {...props as React.HTMLAttributes<HTMLDivElement>}
        >
          {children}
        </div>
      )}
    </>
  );
};
