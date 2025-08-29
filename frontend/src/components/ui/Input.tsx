import React from 'react';
import { clsx } from 'clsx';

interface InputProps {
  label?: string;
  helperText?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: 'text' | 'email' | 'password';
  className?: string;
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  placeholder,
  value,
  onChange,
  type = 'text',
  className,
  disabled = false,
}) => {
  return (
    <div className={clsx('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-text-default">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={clsx(
          'w-full px-3 py-2 bg-surface-700 border rounded-lg text-text-default placeholder-muted',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
          'transition-colors duration-200',
          error ? 'border-danger' : 'border-surface-600',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />
      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-muted">{helperText}</p>
      )}
    </div>
  );
};