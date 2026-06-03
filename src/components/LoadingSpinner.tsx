//use cases 

// Default spinner
{/* <LoadingSpinner size="lg" message="Loading products..." />

// Full screen with progress
<LoadingSpinner fullScreen showProgress message="Please wait..." />

// Pulse animation
<LoadingSpinner variant="pulse" size="md" />

// Skeleton loader
<LoadingSpinner variant="skeleton" size="lg" />

// Dots spinner
<LoadingSpinner variant="dots" size="sm" /> */}





import { useDarkMode } from '@/context/DarkMode';
import { useEffect, useState } from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    message?: string;
    fullScreen?: boolean;
    variant?: 'default' | 'pulse' | 'dots' | 'skeleton';
    showProgress?: boolean;
}

export default function LoadingSpinner({
    size = 'md',
    message = 'Loading...',
    fullScreen = false,
    variant = 'default',
    showProgress = false
}: LoadingSpinnerProps) {
    const { darkMode } = useDarkMode();
    const [progress, setProgress] = useState(0);

    // Simulated progress for better UX (optional)
    useEffect(() => {
        if (!showProgress) return;
        
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return prev;
                return prev + Math.random() * 10;
            });
        }, 200);
        
        return () => clearInterval(interval);
    }, [showProgress]);

    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10',
        lg: 'w-14 h-14',
        xl: 'w-20 h-20'
    };

    const borderSizes = {
        sm: 'border-2',
        md: 'border-[2.5px]',
        lg: 'border-[3px]',
        xl: 'border-[3.5px]'
    };

    const textSizes = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
        xl: 'text-lg'
    };

    const bgColor = darkMode ? 'bg-gray-900' : 'bg-white';
    const textColor = darkMode ? 'text-gray-200' : 'text-gray-700';
    const mutedTextColor = darkMode ? 'text-gray-400' : 'text-gray-500';

    // Default spinner (circular)
    const DefaultSpinner = () => (
        <div className="relative">
            <div
                className={`${sizeClasses[size]} ${borderSizes[size]} rounded-full animate-spin`}
                style={{
                    borderColor: darkMode ? '#2d3748' : '#e5e7eb',
                    borderTopColor: '#10b981',
                    borderRightColor: '#10b981',
                }}
            />
            {showProgress && (
                <div className={`absolute inset-0 flex items-center justify-center ${textSizes[size]} font-mono font-bold ${mutedTextColor}`}>
                    {Math.floor(progress)}%
                </div>
            )}
        </div>
    );

    // Pulse spinner (bouncing dots)
    const PulseSpinner = () => (
        <div className="flex gap-2 items-center">
            <div
                className={`${sizeClasses[size].replace('w-', 'w-3 ').replace('h-', 'h-3 ')} rounded-full animate-bounce`}
                style={{ backgroundColor: '#10b981', animationDelay: '0ms' }}
            />
            <div
                className={`${sizeClasses[size].replace('w-', 'w-3 ').replace('h-', 'h-3 ')} rounded-full animate-bounce`}
                style={{ backgroundColor: '#10b981', animationDelay: '150ms' }}
            />
            <div
                className={`${sizeClasses[size].replace('w-', 'w-3 ').replace('h-', 'h-3 ')} rounded-full animate-bounce`}
                style={{ backgroundColor: '#10b981', animationDelay: '300ms' }}
            />
        </div>
    );

    // Dots spinner (pulsing dots)
    const DotsSpinner = () => (
        <div className="flex gap-1.5 items-center">
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className={`${size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : size === 'lg' ? 'w-2.5 h-2.5' : 'w-3 h-3'} rounded-full animate-pulse`}
                    style={{
                        backgroundColor: '#10b981',
                        animationDelay: `${i * 200}ms`,
                        animationDuration: '1s'
                    }}
                />
            ))}
        </div>
    );

    // Skeleton spinner (shimmer effect)
    const SkeletonSpinner = () => (
        <div className="space-y-3 w-full max-w-md">
            <div
                className={`rounded-sm bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700 animate-shimmer`}
                style={{
                    height: size === 'sm' ? '40px' : size === 'md' ? '60px' : size === 'lg' ? '80px' : '100px',
                    width: '100%',
                    backgroundSize: '200% 100%',
                }}
            />
            <div className="space-y-2">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-sm w-3/4 animate-pulse" />
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-sm w-1/2 animate-pulse" />
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-sm w-5/6 animate-pulse" />
            </div>
        </div>
    );

    // Progress bar spinner
    const ProgressBarSpinner = () => (
        <div className="w-full max-w-xs">
            <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                />
            </div>
            {message && (
                <p className={`text-center mt-3 ${textSizes[size]} ${textColor}`}>
                    {message}
                </p>
            )}
        </div>
    );

    const getSpinnerContent = () => {
        switch (variant) {
            case 'pulse':
                return <PulseSpinner />;
            case 'dots':
                return <DotsSpinner />;
            case 'skeleton':
                return <SkeletonSpinner />;
            default:
                return showProgress ? <ProgressBarSpinner /> : <DefaultSpinner />;
        }
    };

    const containerContent = (
        <div className="flex flex-col items-center justify-center gap-4">
            {getSpinnerContent()}
            {variant !== 'skeleton' && variant !== 'default' && message && (
                <p className={`text-center ${textSizes[size]} ${textColor} font-medium`}>
                    {message}
                </p>
            )}
            {variant === 'default' && !showProgress && message && (
                <div className="text-center">
                    <p className={`${textSizes[size]} ${textColor} font-medium`}>
                        {message}
                    </p>
                    <p className={`text-xs ${mutedTextColor} mt-1`}>
                        Please wait while we load your content
                    </p>
                </div>
            )}
        </div>
    );

    // Add shimmer animation keyframes to document head
    useEffect(() => {
        if (variant === 'skeleton') {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .animate-shimmer {
                    animation: shimmer 1.5s ease-in-out infinite;
                    background: linear-gradient(
                        90deg,
                        transparent 0%,
                        rgba(156, 163, 175, 0.2) 25%,
                        rgba(156, 163, 175, 0.4) 50%,
                        rgba(156, 163, 175, 0.2) 75%,
                        transparent 100%
                    );
                }
                .dark .animate-shimmer {
                    background: linear-gradient(
                        90deg,
                        transparent 0%,
                        rgba(75, 85, 99, 0.3) 25%,
                        rgba(75, 85, 99, 0.5) 50%,
                        rgba(75, 85, 99, 0.3) 75%,
                        transparent 100%
                    );
                }
            `;
            document.head.appendChild(style);
            return () => {
                document.head.removeChild(style);
            };
        }
    }, [variant]);

    if (fullScreen) {
        return (
            <div className={`fixed inset-0 flex items-center justify-center ${bgColor} z-50 transition-all duration-300`}>
                <div className="transform transition-transform duration-300 scale-100">
                    {containerContent}
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center p-4 min-h-[200px]">
            {containerContent}
        </div>
    );
}