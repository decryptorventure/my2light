import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    secondaryActionLabel,
    onSecondaryAction,
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <Icon className="text-slate-500" size={40} strokeWidth={1.5} />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
                {title}
            </h3>

            <p className="text-slate-400 mb-8 max-w-sm">
                {description}
            </p>

            <div className="flex gap-3">
                {actionLabel && onAction && (
                    <Button onClick={onAction}>
                        {actionLabel}
                    </Button>
                )}

                {secondaryActionLabel && onSecondaryAction && (
                    <Button
                        onClick={onSecondaryAction}
                        variant="secondary"
                    >
                        {secondaryActionLabel}
                    </Button>
                )}
            </div>
        </div>
    );
};
