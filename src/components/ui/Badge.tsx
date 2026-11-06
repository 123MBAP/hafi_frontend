import React from 'react';

export type BadgeVariant = 'red' | 'red-subtle' | 'black' | 'green' | 'yellow' | 'neutral' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

export default function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
}: BadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  const variantClasses: Record<BadgeVariant, string> = {
    red: 'bg-[#E5252A] text-white font-bold',
    'red-subtle': 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60 font-semibold',
    black: 'bg-[#0A0A0A] text-white dark:bg-white dark:text-[#0A0A0A] font-bold',
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60 font-semibold',
    yellow: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60 font-semibold',
    neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700 font-medium',
    outline: 'bg-transparent text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md tracking-wider uppercase transition-colors ${sizeClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

