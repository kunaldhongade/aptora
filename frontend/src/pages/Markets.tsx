import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { apiClient, MarketResponse } from '../lib/api';

// Use MarketResponse from API client
type Market = MarketResponse;

export const Markets: React.FC = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'change' | 'volume'>('change');
  const [sortDesc, setSortDesc] = useState(true);

  // Load markets from Kana Labs API through backend
  useEffect(() => {
    const loadMarkets = async () => {
      try {
        setLoading(true);
        const marketsData = await apiClient.getMarkets();
        setMarkets(marketsData);
      } catch (err) {
        console.error('Failed to load markets:', err);
        setError('Failed to load markets data');
      } finally {
        setLoading(false);
      }
    };

    loadMarkets();
  }, []);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'favorites', label: 'Favorites' },
  ];

  const filteredMarkets = markets
    .filter((market: Market) => {
      if (searchTerm && !market.symbol.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (activeFilter === 'favorites') {
        return false; // No favorites functionality yet
      }
      return true;
    })
    .sort((a: Market, b: Market) => {
      switch (sortBy) {
        case 'symbol':
          return sortDesc ? b.symbol.localeCompare(a.symbol) : a.symbol.localeCompare(b.symbol);
        default:
          return a.symbol.localeCompare(b.symbol);
      }
    });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(column);
      setSortDesc(true);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-default mb-4">Markets</h1>
        <div className="bg-surface-700 rounded-2xl border border-surface-600 p-8">
          <div className="text-center text-muted">Loading markets...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-default mb-4">Markets</h1>
        <div className="bg-surface-700 rounded-2xl border border-surface-600 p-8">
          <div className="text-center text-red-400">Error: {error}</div>
        </div>
      </div>
    );
  }

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
        <div className="hidden md:grid md:grid-cols-4 gap-4 p-4 border-b border-surface-600 text-sm font-medium text-muted">
          <button onClick={() => handleSort('symbol')} className="text-left hover:text-text-default">
            Symbol
          </button>
          <div className="text-right">Base Asset</div>
          <div className="text-right">Quote Asset</div>
          <div className="text-right">Status</div>
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
              <div className="hidden md:grid md:grid-cols-4 gap-4 p-4 items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-black font-bold text-sm">
                    {market.symbol.slice(0, 2)}
                  </div>
                  <span className="font-semibold text-text-default">{market.symbol}</span>
                </div>

                <div className="text-right font-mono text-text-default">
                  {market.base_asset}
                </div>

                <div className="text-right font-mono text-text-default">
                  {market.quote_asset}
                </div>

                <div className="text-right">
                  <span className={clsx(
                    'px-2 py-1 text-xs font-medium rounded-full',
                    market.is_active ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
                  )}>
                    {market.is_active ? 'Active' : 'Inactive'}
                  </span>
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
                      <p className="text-sm text-muted">{market.base_asset}/{market.quote_asset}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={clsx(
                      'px-2 py-1 text-xs font-medium rounded-full',
                      market.is_active ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
                    )}>
                      {market.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};