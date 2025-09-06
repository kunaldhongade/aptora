import { motion } from 'framer-motion';
import React from 'react';

interface LoadingAnimationProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    text?: string;
    variant?: 'spinner' | 'pulse' | 'wave' | 'dots' | 'shadow';
    className?: string;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
    size = 'md',
    text,
    variant = 'shadow',
    className = ''
}) => {
    const sizeClasses = {
        sm: 'h-6 w-6',
        md: 'h-12 w-12',
        lg: 'h-16 w-16',
        xl: 'h-24 w-24'
    };

    const textSizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl'
    };

    const renderSpinner = () => (
        <motion.div
            className={`${sizeClasses[size]} border-4 border-surface-600 border-t-primary rounded-full`}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
    );

    const renderPulse = () => (
        <motion.div
            className={`${sizeClasses[size]} bg-primary rounded-full`}
            animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
    );

    const renderWave = () => (
        <div className="flex space-x-1">
            {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                    key={i}
                    className="w-2 bg-primary rounded-full"
                    animate={{
                        height: ['8px', '24px', '8px'],
                        opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    );

    const renderDots = () => (
        <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="w-3 h-3 bg-primary rounded-full"
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    );

    const renderShadow = () => (
        <div className="relative">
            {/* Main orb */}
            <motion.div
                className={`${sizeClasses[size]} bg-gradient-to-br from-primary to-primary/60 rounded-full relative z-10`}
                animate={{
                    scale: [1, 1.1, 1],
                    boxShadow: [
                        '0 0 20px rgba(99, 102, 241, 0.3)',
                        '0 0 40px rgba(99, 102, 241, 0.6)',
                        '0 0 20px rgba(99, 102, 241, 0.3)'
                    ]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                {/* Inner glow */}
                <motion.div
                    className="absolute inset-2 bg-white/20 rounded-full"
                    animate={{
                        opacity: [0.3, 0.8, 0.3]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </motion.div>

            {/* Outer shadow rings */}
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className={`absolute inset-0 ${sizeClasses[size]} border-2 border-primary/20 rounded-full`}
                    animate={{
                        scale: [1, 1.5 + i * 0.3, 1],
                        opacity: [0.6, 0.1, 0.6]
                    }}
                    transition={{
                        duration: 2.5 + i * 0.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.3
                    }}
                />
            ))}

            {/* Floating particles */}
            {[0, 1, 2, 3].map((i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-primary/60 rounded-full"
                    animate={{
                        x: [0, Math.cos(i * Math.PI / 2) * 30],
                        y: [0, Math.sin(i * Math.PI / 2) * 30],
                        opacity: [0, 1, 0]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.5
                    }}
                    style={{
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)'
                    }}
                />
            ))}
        </div>
    );

    const renderAnimation = () => {
        switch (variant) {
            case 'spinner': return renderSpinner();
            case 'pulse': return renderPulse();
            case 'wave': return renderWave();
            case 'dots': return renderDots();
            case 'shadow': return renderShadow();
            default: return renderShadow();
        }
    };

    return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            {renderAnimation()}
            {text && (
                <motion.p
                    className={`mt-4 text-muted ${textSizeClasses[size]}`}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                    {text}
                </motion.p>
            )}
        </div>
    );
};

// Preset loading components for common use cases
export const PageLoading: React.FC<{ text?: string }> = ({ text = "Loading..." }) => (
    <div className="min-h-screen bg-bg-900 text-white flex items-center justify-center">
        <LoadingAnimation size="xl" text={text} variant="shadow" />
    </div>
);

export const CardLoading: React.FC<{ text?: string }> = ({ text }) => (
    <div className="flex items-center justify-center py-12">
        <LoadingAnimation size="lg" text={text} variant="shadow" />
    </div>
);

export const InlineLoading: React.FC<{ text?: string }> = ({ text }) => (
    <div className="flex items-center justify-center py-4">
        <LoadingAnimation size="md" text={text} variant="dots" />
    </div>
);
