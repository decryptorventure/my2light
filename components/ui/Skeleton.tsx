import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'shimmer' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'shimmer'
}) => {
  const baseStyles = 'bg-slate-800/50';
  
  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-xl'
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    shimmer: 'shimmer',
    none: ''
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${animationStyles[animation]} ${className}`}
      style={style}
    />
  );
};

// Pre-built skeleton patterns
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 bg-slate-800/30 rounded-xl border border-slate-800 ${className}`}>
    <div className="flex gap-4 mb-3">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
    <Skeleton variant="rectangular" height={120} className="mb-2"  />
    <div className="space-y-2">
      <Skeleton variant="text" width="85%" />
      <Skeleton variant="text" width="70%" />
    </div>
  </div>
);

export const SkeletonCourtCard: React.FC = () => (
  <div className="flex p-3 gap-4 items-center bg-slate-800/30 rounded-xl border border-slate-800">
    <Skeleton variant="rectangular" width={80} height={80} className="flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="flex justify-between items-start">
        <Skeleton variant="text" width="60%" height={16} />
        <Skeleton variant="rectangular" width={60} height={20} className="rounded-full" />
      </div>
      <Skeleton variant="text" width="80%" height={12} />
      <Skeleton variant="text" width="40%" height={12} />
    </div>
  </div>
);

export const SkeletonHighlightCard: React.FC = () => (
  <div className="min-w-[160px] h-[240px] bg-slate-800/30 rounded-xl border border-slate-800 shimmer flex-shrink-0" />
);

export const SkeletonStatCard: React.FC = () => (
  <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-800 flex flex-col items-center gap-3">
    <Skeleton variant="circular" width={48} height={48} />
    <div className="space-y-2 w-full">
      <Skeleton variant="text" width="80%" className="mx-auto" />
      <Skeleton variant="text" width="60%" className="mx-auto" height={12} />
    </div>
  </div>
);

export const SkeletonListItem: React.FC = () => (
  <div className="flex gap-3 items-center p-3">
    <Skeleton variant="circular" width={40} height={40} />
    <div className="flex-1 space-y-2">
      <Skeleton variant="text" width="70%" />
      <Skeleton variant="text" width="50%" height={12} />
    </div>
    <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" />
  </div>
);

export const SkeletonProfileHeader: React.FC = () => (
  <div className="flex flex-col items-center mb-6">
    <Skeleton variant="circular" width={96} height={96} className="mb-4" />
    <Skeleton variant="text" width={120} height={24} className="mb-2" />
    <div className="flex items-center gap-2">
      <Skeleton variant="rectangular" width={80} height={24} className="rounded-full" />
      <Skeleton variant="text" width={80} height={16} />
    </div>
  </div>
);
