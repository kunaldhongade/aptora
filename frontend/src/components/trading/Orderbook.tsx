import React from 'react';
import { clsx } from 'clsx';

interface OrderbookEntry {
  price: number;
  size: number;
  total: number;
}

interface OrderbookProps {
  bids: OrderbookEntry[];
  asks: OrderbookEntry[];
  currentPrice: number;
  onPriceClick?: (price: number) => void;
  className?: string;
}

export const Orderbook: React.FC<OrderbookProps> = ({
  bids,
  asks,
  currentPrice,
  onPriceClick,
  className,
}) => {
  const maxTotal = Math.max(
    ...bids.map(b => b.total),
    ...asks.map(a => a.total)
  );

  const OrderRow: React.FC<{ 
    entry: OrderbookEntry; 
    side: 'bid' | 'ask';
    index: number;
  }> = ({ entry, side, index }) => (
    <motion.div
      initial={{ opacity: 0, x: side === 'bid' ? -10 : 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      onClick={() => onPriceClick?.(entry.price)}
      className={clsx(
        'relative grid grid-cols-3 gap-2 py-1 px-2 text-xs font-mono cursor-pointer',
        'hover:bg-surface-600/50 transition-colors'
      )}
    >
      <div
        className={clsx(
          'absolute inset-0 transition-all duration-300',
          side === 'bid' ? 'bg-success/10' : 'bg-danger/10'
        )}
        style={{ 
          width: `${(entry.total / maxTotal) * 100}%`,
          right: side === 'ask' ? 0 : 'auto',
          left: side === 'bid' ? 0 : 'auto',
        }}
      />
      <span className={clsx(
        'relative z-10 text-right',
        side === 'bid' ? 'text-success' : 'text-danger'
      )}>
        {entry.price.toFixed(2)}
      </span>
      <span className="relative z-10 text-right text-text-default">
        {entry.size.toLocaleString()}
      </span>
      <span className="relative z-10 text-right text-muted">
        {entry.total.toLocaleString()}
      </span>
    </motion.div>
  );

  return (
    <div className={clsx('bg-surface-700 rounded-2xl border border-surface-600 overflow-hidden', className)}>
      <div className="p-4 border-b border-surface-600">
        <h3 className="font-semibold text-text-default">Order Book</h3>
      </div>
      
      <div className="p-2">
        {/* Header */}
        <div className="grid grid-cols-3 gap-2 py-2 px-2 text-xs font-medium text-muted border-b border-surface-600">
          <span className="text-right">Price</span>
          <span className="text-right">Size</span>
          <span className="text-right">Total</span>
        </div>

        {/* Asks (reverse order) */}
        <div className="max-h-32 overflow-y-auto">
          {asks.slice().reverse().map((ask, index) => (
            <OrderRow key={`ask-${ask.price}`} entry={ask} side="ask" index={index} />
          ))}
        </div>

        {/* Current Price */}
        <div className="py-3 px-2 text-center">
          <span className="text-lg font-mono font-semibold text-primary">
            ${currentPrice.toFixed(2)}
          </span>
          <div className="text-xs text-muted">Mark Price</div>
        </div>

        {/* Bids */}
        <div className="max-h-32 overflow-y-auto">
          {bids.map((bid, index) => (
            <OrderRow key={`bid-${bid.price}`} entry={bid} side="bid" index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};