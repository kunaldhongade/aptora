import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '../ui/Button';
import { NumberInput } from '../ui/NumberInput';
import { LeverageSlider } from '../ui/LeverageSlider';
import { Settings } from 'lucide-react';

interface OrderEntryProps {
  symbol: string;
  price: number;
  className?: string;
}

export const OrderEntry: React.FC<OrderEntryProps> = ({
  symbol,
  price,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'market' | 'limit' | 'trigger'>('market');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState<number>(100);
  const [leverage, setLeverage] = useState<number>(10);
  const [limitPrice, setLimitPrice] = useState<number>(price);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const notional = quantity * price;
  const requiredCollateral = notional / leverage;
  const estimatedFee = notional * 0.001; // 0.1% fee

  const tabs = [
    { id: 'market', label: 'Market' },
    { id: 'limit', label: 'Limit' },
    { id: 'trigger', label: 'Trigger' },
  ] as const;

  return (
    <div className={clsx('bg-surface-700 rounded-2xl border border-surface-600 p-4 space-y-4', className)}>
      {/* Tabs */}
      <div className="flex bg-bg-800 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex-1 py-2 text-sm font-medium rounded-md transition-colors',
              activeTab === tab.id
                ? 'bg-primary text-black'
                : 'text-muted hover:text-text-default'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Side Toggle */}
      <div className="flex bg-bg-800 rounded-lg p-1">
        <button
          onClick={() => setSide('buy')}
          className={clsx(
            'flex-1 py-3 text-sm font-semibold rounded-md transition-colors',
            side === 'buy'
              ? 'bg-success text-black'
              : 'text-muted hover:text-text-default'
          )}
        >
          BUY
        </button>
        <button
          onClick={() => setSide('sell')}
          className={clsx(
            'flex-1 py-3 text-sm font-semibold rounded-md transition-colors',
            side === 'sell'
              ? 'bg-danger text-white'
              : 'text-muted hover:text-text-default'
          )}
        >
          SELL
        </button>
      </div>

      {/* Order Form */}
      <div className="space-y-4">
        <NumberInput
          label="Quantity (USDT)"
          value={quantity}
          onChange={setQuantity}
          min={1}
          max={100000}
          step={1}
          showMaxButton={true}
        />

        {activeTab !== 'market' && (
          <NumberInput
            label="Price"
            value={limitPrice}
            onChange={setLimitPrice}
            min={0.01}
            step={0.01}
          />
        )}

        <LeverageSlider
          value={leverage}
          onChange={setLeverage}
        />

        {/* Advanced Settings */}
        <div className="space-y-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-muted hover:text-text-default transition-colors"
          >
            <Settings className="w-4 h-4" />
            Advanced Settings
          </button>
          
          {showAdvanced && (
            <div className="space-y-3 p-3 bg-bg-800 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Take Profit</span>
                <input type="checkbox" className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Stop Loss</span>
                <input type="checkbox" className="rounded" />
              </div>
            </div>
          )}
        </div>

        {/* Order Preview */}
        <div className="space-y-2 p-3 bg-bg-800 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Notional</span>
            <span className="font-mono">${notional.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Required Collateral</span>
            <span className="font-mono">${requiredCollateral.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Est. Fee</span>
            <span className="font-mono">${estimatedFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Liquidation Price</span>
            <span className="font-mono text-danger">
              ${(price * 0.9).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          variant={side === 'buy' ? 'primary' : 'destructive'}
          size="lg"
          className="w-full"
        >
          {side === 'buy' ? 'BUY' : 'SELL'} {symbol}
        </Button>

        <p className="text-xs text-muted text-center">
          Gasless trades enabled by Kana Paymaster
        </p>
      </div>
    </div>
  );
};