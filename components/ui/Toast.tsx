import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export interface ToastProps {
    id?: string;
    message: string;
    type: ToastType;
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            layout
            className={`
                pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md min-w-[300px]
                ${type === 'success' ? 'bg-slate-900/90 border-lime-500/50 text-white' : ''}
                ${type === 'error' ? 'bg-slate-900/90 border-red-500/50 text-white' : ''}
                ${type === 'info' ? 'bg-slate-900/90 border-blue-500/50 text-white' : ''}
            `}
        >
            <div className={`
                p-1 rounded-full 
                ${type === 'success' ? 'bg-lime-500/20 text-lime-400' : ''}
                ${type === 'error' ? 'bg-red-500/20 text-red-400' : ''}
                ${type === 'info' ? 'bg-blue-500/20 text-blue-400' : ''}
            `}>
                {type === 'success' && <CheckCircle size={18} />}
                {type === 'error' && <AlertCircle size={18} />}
                {type === 'info' && <Info size={18} />}
            </div>

            <p className="text-sm font-medium flex-1">{message}</p>

            <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors"
            >
                <X size={16} />
            </button>
        </motion.div>
    );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <Toast
                            key={toast.id}
                            id={toast.id}
                            message={toast.message}
                            type={toast.type}
                            onClose={() => removeToast(toast.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};
