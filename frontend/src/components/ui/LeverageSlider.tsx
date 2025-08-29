import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface LeverageSliderProps {
  value?: number;
  onChange?: (value: number) => void;
  className?: string;
}

const leverageStops = [0.5, 1, 2, 5, 10, 20, 50, 100];

export const LeverageSlider: React.FC<LeverageSliderProps> = ({
  value = 1,
  onChange,
  className,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onChange?.(newValue);
  };

  const getRiskColor = (leverage: number) => {
    if (leverage <= 2) return 'bg-success';
    if (leverage <= 10) return 'bg-warning';
    return 'bg-danger';
  };

  const getPosition = (leverage: number) => {
    const index = leverageStops.findIndex(stop => stop >= leverage);
    if (index === -1) return 100;
    
    const prevStop = leverageStops[Math.max(0, index - 1)];
    const nextStop = leverageStops[index];
    const ratio = (leverage - prevStop) / (nextStop - prevStop);
    
    return ((index - 1 + ratio) / (leverageStops.length - 1)) * 100;
  };

  return (
    <div className={clsx('space-y-4', className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-text-default">Leverage</span>
        <span className="text-sm font-mono font-medium text-primary">{value}×</span>
      </div>
      
      <div className="relative">
        <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
          <div 
            className={clsx('h-full transition-colors duration-300', getRiskColor(value))}
            style={{ width: `${getPosition(value)}%` }}
          />
        </div>
        
        <div className="relative mt-1">
          <input
            type="range"
            min={0.5}
            max={100}
            step={0.1}
            value={value}
            onChange={handleSliderChange}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="absolute inset-0 w-full h-4 opacity-0 cursor-pointer"
          />
          
          <motion.div
            className="absolute top-0 w-4 h-4 bg-primary rounded-full shadow-lg transform -translate-x-2 -translate-y-1"
            style={{ left: `${getPosition(value)}%` }}
            whileHover={{ scale: 1.1 }}
            whileDrag={{ scale: 1.2 }}
          >
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-bg-800 px-2 py-1 rounded text-xs font-mono whitespace-nowrap shadow-lg border border-surface-600"
              >
                {value}× leverage
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-bg-800" />
              </motion.div>
            )}
          </motion.div>
        </div>
        
        <div className="flex justify-between mt-4">
          {leverageStops.map((stop) => (
            <button
              key={stop}
              onClick={() => onChange?.(stop)}
              className={clsx(
                'text-xs px-2 py-1 rounded transition-colors',
                value === stop 
                  ? 'bg-primary text-black font-medium' 
                  : 'text-muted hover:text-text-default'
              )}
            >
              {stop}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};