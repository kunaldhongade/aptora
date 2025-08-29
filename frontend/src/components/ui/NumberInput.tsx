import React from 'react';
import { clsx } from 'clsx';
import { Minus, Plus } from 'lucide-react';
import { Button } from './Button';

interface NumberInputProps {
  label?: string;
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showMaxButton?: boolean;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value = 0,
  onChange,
  min = 0,
  max = 1000000,
  step = 1,
  placeholder,
  className,
  disabled = false,
  showMaxButton = false,
}) => {
  const handleIncrement = () => {
    const newValue = Math.min((value || 0) + step, max);
    onChange?.(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max((value || 0) - step, min);
    onChange?.(newValue);
  };

  const handleInputChange = (inputValue: string) => {
    const numValue = parseFloat(inputValue) || 0;
    const clampedValue = Math.min(Math.max(numValue, min), max);
    onChange?.(clampedValue);
  };

  const handleMax = () => {
    onChange?.(max);
  };

  return (
    <div className={clsx('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-text-default">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className="absolute left-2 z-10 p-1 rounded text-muted hover:text-text-default disabled:opacity-50"
        >
          <Minus className="w-4 h-4" />
        </button>
        
        <input
          type="number"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={clsx(
            'w-full px-10 py-2 bg-surface-700 border border-surface-600 rounded-lg text-center font-mono',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
            'transition-colors duration-200',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          className="absolute right-2 z-10 p-1 rounded text-muted hover:text-text-default disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
        
        {showMaxButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMax}
            className="absolute right-8 z-10 px-2 py-0.5 text-xs"
          >
            MAX
          </Button>
        )}
      </div>
    </div>
  );
};