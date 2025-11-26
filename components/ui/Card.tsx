import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  variant?: 'glass' | 'solid';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  variant = 'glass', 
  hoverEffect = false,
  className = '', 
  ...props 
}) => {
  const baseStyles = "rounded-2xl overflow-hidden";
  const glassStyles = "bg-slate-800/40 backdrop-blur-md border border-white/5 shadow-xl";
  const solidStyles = "bg-slate-850 border border-slate-700";

  return (
    <motion.div
      whileHover={hoverEffect ? { y: -4, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)" } : undefined}
      className={`${baseStyles} ${variant === 'glass' ? glassStyles : solidStyles} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
