import { clsx } from 'clsx';
import { BarChart3, TrendingUp } from 'lucide-react';
import React, { useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import TradingViewChart from './TradingViewChart';

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
  chartType?: 'tradingview' | 'recharts';
}

const timeframes = ['1m', '5m', '15m', '1h', '4h', '1D'];
const indicators = ['EMA', 'SMA', 'VWAP'];

export const Chart: React.FC<ChartProps> = ({
  symbol,
  data,
  className,
  chartType = 'tradingview',
}) => {
  const [activeTimeframe, setActiveTimeframe] = useState('15m');
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
  const [currentChartType, setCurrentChartType] = useState<'tradingview' | 'recharts'>(chartType);

  // Ensure data is an array and handle errors gracefully
  const safeData = Array.isArray(data) ? data : [];
  const chartData = safeData.map(candle => ({
    time: candle.time,
    price: candle.close,
  }));

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-800 border border-surface-600 rounded-lg p-3 shadow-lg">
          <p className="text-xs text-muted">{label ? new Date(label).toLocaleTimeString() : ''}</p>
          <p className="font-mono font-semibold text-accent">
            ${payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };


  // If TradingView chart is selected, render it
  if (currentChartType === 'tradingview') {
    return (
      <div className={clsx('bg-surface-700 rounded-2xl border border-surface-600 overflow-hidden flex flex-col', className)}>
        {/* Chart Type Selector */}
        <div className="flex items-center justify-between p-4 border-b border-surface-600">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-text-default">Advanced Trading Chart</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentChartType('recharts')}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-surface-600 hover:bg-surface-500 text-text-default rounded-md transition-colors"
            >
              <BarChart3 className="w-3 h-3" />
              <span>Simple Chart</span>
            </button>
          </div>
        </div>

        <div className="flex-1">
          <TradingViewChart
            symbol={symbol}
            theme="dark"
            fillParent={true}
            className="h-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('bg-surface-700 rounded-2xl border border-surface-600', className)}>
      {/* Header */}
      <div className="p-4 border-b border-surface-600">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-text-default" />
            <h3 className="font-semibold text-text-default">{symbol} / USDT</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentChartType('tradingview')}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-primary hover:bg-primary/80 text-black rounded-md transition-colors shadow-glow"
            >
              <TrendingUp className="w-3 h-3" />
              <span>Advanced Chart</span>
            </button>
            <div className="text-right">
              <div className="text-lg font-mono font-semibold text-accent">
                ${safeData.length > 0 ? safeData[safeData.length - 1]?.close.toFixed(2) : '0.00'}
              </div>
              <div className="text-sm text-muted">Change N/A</div>
            </div>
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
                  ? 'bg-primary text-black shadow-glow'
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