import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

interface LikeAnimationProps {
    isActive: boolean;
    onComplete?: () => void;
}

export const LikeAnimation: React.FC<LikeAnimationProps> = ({ isActive, onComplete }) => {
    return (
        <AnimatePresence onExitComplete={onComplete}>
            {isActive && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                    <motion.div
                        initial={{ scale: 0, opacity: 0, rotate: -45 }}
                        animate={{
                            scale: [0, 1.5, 1],
                            opacity: [0, 1, 0],
                            rotate: [-45, 0, 45]
                        }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <Heart
                            size={100}
                            className="fill-white text-white drop-shadow-lg"
                            strokeWidth={0}
                        />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
