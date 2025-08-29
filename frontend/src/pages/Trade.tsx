import React, { useState } from 'react';
import { OrderEntry } from '../components/trading/OrderEntry';
import { Chart } from '../components/trading/Chart';
import { Orderbook } from '../components/trading/Orderbook';
import { Button } from '../components/ui/Button';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export const Trade: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'history'>('positions');

  const symbol = 'BTC-USDT';
  const currentPrice = 64250;

  // Mock data
  const chartData = Array.from({ length: 50 }, (_, i) => ({
    time: Date.now() - (50 - i) * 60000,
    open: currentPrice + Math.random() * 1000 - 500,
    high: currentPrice + Math.random() * 1200 - 400,
    low: currentPrice + Math.random() * 800 - 600,
    close: currentPrice + Math.random() * 1000 - 500,
    volume: Math.random() * 1000000,
  }));

  const mockBids = Array.from({ length: 15 }, (_, i) => ({
    price: currentPrice - (i + 1) * 10,
    size: Math.floor(Math.random() * 50) + 10,
    total: Math.floor(Math.random() * 500) + 100,
  }));

  const mockAsks = Array.from({ length: 15 }, (_, i) => ({
    price: currentPrice + (i + 1) * 10,
    size: Math.floor(Math.random() * 50) + 10,
    total: Math.floor(Math.random() * 500) + 100,
  }));

  const positions = [
    { symbol: 'BTC-USDT', side: 'Long', size: 1000, entry: 62000, mark: 64250, pnl: 2250, margin: 620 },
    { symbol: 'ETH-USDT', side: 'Short', size: 5000, entry: 3500, mark: 3421, pnl: 395, margin: 1750 },
  ];

  const orders = [
    { symbol: 'SOL-USDT', type: 'Limit', side: 'Buy', size: 100, price: 150, status: 'Open' },
  ];

  return (
    <div className="h-full">
      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-6 h-full">
        {/* Order Entry */}
        <div className="col-span-3">
          <OrderEntry symbol={symbol} price={currentPrice} />
        </div>
        
        {/* Chart */}
        <div className="col-span-6">
          <Chart symbol={symbol} data={chartData} className="h-full" />
        </div>
        
        {/* Orderbook */}
        <div className="col-span-3">
          <Orderbook 
            bids={mockBids}
            asks={mockAsks}
            currentPrice={currentPrice}
            className="h-full"
          />
        </div>
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="lg:hidden space-y-6">
        {/* Chart */}
        <Chart symbol={symbol} data={chartData} />
        
        {/* Order Entry */}
        <OrderEntry symbol={symbol} price={currentPrice} />
        
        {/* Orderbook */}
        <Orderbook 
          bids={mockBids.slice(0, 8)}
          asks={mockAsks.slice(0, 8)}
          currentPrice={currentPrice}
        />
      </div>

      {/* Bottom Panel - Positions/Orders */}
      <div className="mt-6 bg-surface-700 rounded-2xl border border-surface-600">
        <div className="flex border-b border-surface-600">
          {(['positions', 'orders', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'flex-1 py-3 px-4 text-sm font-medium capitalize transition-colors',
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted hover:text-text-default'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === 'positions' && (
            <div className="space-y-2">
              {positions.length === 0 ? (
                <div className="text-center py-8 text-muted">
                  No open positions
                </div>
              ) : (
                positions.map((position, index) => (
                  <motion.div
                    key={position.symbol}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-bg-800 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-text-default">{position.symbol}</span>
                      <span className={clsx(
                        'text-sm font-medium px-2 py-1 rounded',
                        position.side === 'Long' 
                          ? 'bg-success/20 text-success' 
                          : 'bg-danger/20 text-danger'
                      )}>
                        {position.side}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted block">Size</span>
                        <span className="font-mono">${position.size}</span>
                      </div>
                      <div>
                        <span className="text-muted block">Entry</span>
                        <span className="font-mono">${position.entry}</span>
                      </div>
                      <div>
                        <span className="text-muted block">Mark</span>
                        <span className="font-mono">${position.mark}</span>
                      </div>
                      <div>
                        <span className="text-muted block">PnL</span>
                        <span className={clsx(
                          'font-mono font-semibold',
                          position.pnl >= 0 ? 'text-success' : 'text-danger'
                        )}>
                          {position.pnl >= 0 ? '+' : ''}${position.pnl}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-2">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-muted">
                  No open orders
                </div>
              ) : (
                orders.map((order, index) => (
                  <motion.div
                    key={`${order.symbol}-${order.price}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-bg-800 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-text-default">{order.symbol}</span>
                      <div className="text-sm text-muted">
                        {order.type} {order.side} ${order.size} @ ${order.price}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-warning/20 text-warning px-2 py-1 rounded">
                        {order.status}
                      </span>
                      <Button variant="ghost" size="sm">
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="text-center py-8 text-muted">
              No trade history
            </div>
          )}
        </div>
      </div>
    </div>
  );
};