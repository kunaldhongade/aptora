import React, { useState } from 'react';
import { clsx } from 'clsx';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface ChartProps {
  symbol: string;
  data: Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  className?: string;
}

const timeframes = ['1m', '5m', '15m', '1h', '4h', '1D'];
const indicators = ['EMA', 'SMA', 'VWAP'];

export const Chart: React.FC<ChartProps> = ({
  symbol,
  data,
  className,
}) => {
  const [activeTimeframe, setActiveTimeframe] = useState('15m');
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);

  const chartData = data.map(candle => ({
    time: candle.time,
    price: candle.close,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-800 border border-surface-600 rounded-lg p-3 shadow-lg">
          <p className="text-xs text-muted">{new Date(label).toLocaleTimeString()}</p>
          <p className="font-mono font-semibold text-primary">
            ${payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={clsx('bg-surface-700 rounded-2xl border border-surface-600', className)}>
      {/* Header */}
      <div className="p-4 border-b border-surface-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text-default">{symbol} / USDT</h3>
          <div className="text-right">
            <div className="text-lg font-mono font-semibold text-primary">
              ${data[data.length - 1]?.close.toFixed(2)}
            </div>
            <div className="text-sm text-success">+2.34%</div>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-1 mb-3">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setActiveTimeframe(tf)}
              className={clsx(
                'px-3 py-1.5 text-xs font-medium rounded transition-colors',
                activeTimeframe === tf
                  ? 'bg-primary text-black'
                  : 'text-muted hover:text-text-default'
              )}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Indicators */}
        <div className="flex gap-2">
          {indicators.map((indicator) => (
            <button
              key={indicator}
              onClick={() => {
                setActiveIndicators(prev => 
                  prev.includes(indicator)
                    ? prev.filter(i => i !== indicator)
                    : [...prev, indicator]
                );
              }}
              className={clsx(
                'px-2 py-1 text-xs rounded border transition-colors',
                activeIndicators.includes(indicator)
                  ? 'bg-accent/20 border-accent text-accent'
                  : 'border-surface-600 text-muted hover:text-text-default'
              )}
            >
              {indicator}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis 
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9AA7B2' }}
              tickFormatter={(time) => new Date(time).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            />
            <YAxis 
              domain={['dataMin - 5', 'dataMax + 5']}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9AA7B2' }}
              tickFormatter={(price) => `$${price.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#3DD1FF" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#3DD1FF' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Watermark */}
      <div className="absolute bottom-4 right-4 text-xs text-muted/50 font-mono">
        Powered by Aptora
      </div>
    </div>
  );
};