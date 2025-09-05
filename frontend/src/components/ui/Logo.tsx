import { clsx } from 'clsx';
import React from 'react';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
    size = 'md',
    className,
    showTagline = false
}) => {
    const sizeClasses = {
        sm: 'text-lg',
        md: 'text-xl',
        lg: 'text-2xl',
        xl: 'text-4xl',
    };

    return (
        <div className={clsx('flex flex-col items-center', className)}>
            <span
                className={clsx(
                    'press-start-2p-regular text-primary',
                    sizeClasses[size]
                )}
                style={{
                    fontFamily: '"Press Start 2P", system-ui, monospace',
                    fontWeight: 400,
                    fontStyle: 'normal'
                }}
            >
                Aptora
            </span>
            {showTagline && (
                <span className="text-xs text-muted mt-1 font-sans">
                    Advanced Perpetual Trading
                </span>
            )}
        </div>
    );
};
