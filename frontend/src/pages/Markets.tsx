import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Search, Filter, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

interface Market {
  id: string;
  symbol: string;
  price: number;
  change24h: number;
  volume: string;
  funding: number;
  openInterest: string;
  isFavorited: boolean;
}

const mockMarkets: Market[] = [
  { id: '1', symbol: 'BTC-USDT', price: 64250, change24h: 2.34, volume: '2.4B', funding: 0.01, openInterest: '1.2B', isFavorited: true },
  { id: '2', symbol: 'ETH-USDT', price: 3421, change24h: -1.23, volume: '1.8B', funding: -0.005, openInterest: '890M', isFavorited: false },
  { id: '3', symbol: 'SOL-USDT', price: 156, change24h: 5.67, volume: '456M', funding: 0.02, openInterest: '234M', isFavorited: true },
  { id: '4', symbol: 'DOGE-USDT', price: 0.142, change24h: 12.45, volume: '234M', funding: 0.008, openInterest: '156M', isFavorited: false },
];

export const Markets: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'change' | 'volume'>('change');
  const [sortDesc, setSortDesc] = useState(true);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'favorites', label: 'Favorites' },
  ];

  const filteredMarkets = mockMarkets
    .filter(market => {
      if (searchTerm && !market.symbol.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (activeFilter === 'favorites' && !market.isFavorited) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let aVal: number, bVal: number;
      
      switch (sortBy) {
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'change':
          aVal = a.change24h;
          bVal = b.change24h;
          break;
        case 'volume':
          aVal = parseFloat(a.volume.replace(/[BM]/g, ''));
          bVal = parseFloat(b.volume.replace(/[BM]/g, ''));
          break;
        default:
          return a.symbol.localeCompare(b.symbol);
      }
      
      return sortDesc ? bVal - aVal : aVal - bVal;
    });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(column);
      setSortDesc(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-default mb-4">Markets</h1>
        
        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search markets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-700 border border-surface-600 rounded-lg text-text-default placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={clsx(
                  'px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
                  activeFilter === filter.id
                    ? 'bg-primary text-black'
                    : 'bg-surface-700 text-muted hover:text-text-default border border-surface-600'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Markets Table */}
      <div className="bg-surface-700 rounded-2xl border border-surface-600 overflow-hidden">
        {/* Desktop Table Header */}
        <div className="hidden md:grid md:grid-cols-7 gap-4 p-4 border-b border-surface-600 text-sm font-medium text-muted">
          <button onClick={() => handleSort('symbol')} className="text-left hover:text-text-default">
            Symbol
          </button>
          <button onClick={() => handleSort('price')} className="text-right hover:text-text-default">
            Price
          </button>
          <button onClick={() => handleSort('change')} className="text-right hover:text-text-default">
            24h Change
          </button>
          <button onClick={() => handleSort('volume')} className="text-right hover:text-text-default">
            Volume
          </button>
          <span className="text-right">Funding</span>
          <span className="text-right">Open Interest</span>
          <span></span>
        </div>

        {/* Market Rows */}
        <div className="divide-y divide-surface-600">
          {filteredMarkets.map((market, index) => (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="hover:bg-surface-600/30 transition-colors cursor-pointer"
            >
              {/* Desktop Row */}
              <div className="hidden md:grid md:grid-cols-7 gap-4 p-4 items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-black font-bold text-sm">
                    {market.symbol.slice(0, 2)}
                  </div>
                  <span className="font-semibold text-text-default">{market.symbol}</span>
                </div>
                
                <div className="text-right font-mono font-semibold text-text-default">
                  ${market.price.toLocaleString()}
                </div>
                
                <div className={clsx(
                  'text-right font-medium flex items-center justify-end gap-1',
                  market.change24h >= 0 ? 'text-success' : 'text-danger'
                )}>
                  {market.change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
                </div>
                
                <div className="text-right font-mono text-text-default">
                  ${market.volume}
                </div>
                
                <div className={clsx(
                  'text-right font-mono',
                  market.funding >= 0 ? 'text-success' : 'text-danger'
                )}>
                  {market.funding >= 0 ? '+' : ''}{(market.funding * 100).toFixed(3)}%
                </div>
                
                <div className="text-right font-mono text-muted">
                  ${market.openInterest}
                </div>
                
                <div className="text-right">
                  <button className="text-muted hover:text-warning transition-colors">
                    <Star className={clsx('w-4 h-4', market.isFavorited && 'fill-warning text-warning')} />
                  </button>
                </div>
              </div>

              {/* Mobile Card */}
              <div className="md:hidden p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-black font-bold text-sm">
                      {market.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-default">{market.symbol}</h3>
                      <p className="text-sm text-muted">Volume ${market.volume}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-mono font-semibold text-text-default">
                      ${market.price.toLocaleString()}
                    </div>
                    <div className={clsx(
                      'text-sm font-medium flex items-center gap-1',
                      market.change24h >= 0 ? 'text-success' : 'text-danger'
                    )}>
                      {market.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted">
                    Funding: <span className={clsx('font-mono', market.funding >= 0 ? 'text-success' : 'text-danger')}>
                      {market.funding >= 0 ? '+' : ''}{(market.funding * 100).toFixed(3)}%
                    </span>
                  </span>
                  <button className="text-muted hover:text-warning transition-colors">
                    <Star className={clsx('w-4 h-4', market.isFavorited && 'fill-warning text-warning')} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};