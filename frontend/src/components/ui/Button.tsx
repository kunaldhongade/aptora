import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  onClick,
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-900';
  
  const variantClasses = {
    primary: 'bg-primary text-black hover:bg-primary-600 shadow-sm hover:shadow-glow',
    secondary: 'bg-surface-700 text-text-default hover:bg-slate-600 border border-surface-600',
    ghost: 'text-muted hover:text-text-default hover:bg-surface-700 border border-transparent hover:border-surface-600',
    destructive: 'bg-danger text-white hover:bg-red-600 shadow-sm',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
  };

  return (
    <motion.button
      whileHover={{ y: variant === 'primary' ? -1 : 0 }}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
    </motion.button>
  );
};