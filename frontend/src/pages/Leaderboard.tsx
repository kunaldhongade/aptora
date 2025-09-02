import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { Filter, Search } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { TraderCard } from '../components/ui/Card';

// Placeholder data - will be replaced with backend data when leaderboard endpoints are available
const mockTraders: any[] = [];

export const Leaderboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'7d' | '30d' | 'all'>('7d');

  const sortOptions = [
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: 'all', label: 'All Time' },
  ] as const;

  const filteredTraders = mockTraders.filter(trader =>
    trader.handle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-default mb-4">Leaderboard</h1>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search traders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-700 border border-surface-600 rounded-lg text-text-default placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Sort Options */}
          <div className="flex gap-2">
            {sortOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSortBy(option.id)}
                className={clsx(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  sortBy === option.id
                    ? 'bg-primary text-black'
                    : 'bg-surface-700 text-muted hover:text-text-default border border-surface-600'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {filteredTraders.slice(0, 3).map((trader, index) => {
          const podiumOrder = [1, 0, 2]; // Second, First, Third for visual hierarchy
          const actualIndex = podiumOrder[index];
          const actualTrader = filteredTraders[actualIndex];

          if (!actualTrader) return null;

          return (
            <motion.div
              key={actualTrader.handle}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={clsx(
                'relative',
                actualIndex === 0 && 'md:order-2 md:transform md:scale-110'
              )}
            >
              {/* Rank Badge */}
              <div className={clsx(
                'absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10',
                actualIndex === 0 && 'bg-warning text-black',
                actualIndex === 1 && 'bg-muted text-black',
                actualIndex === 2 && 'bg-orange-600 text-white'
              )}>
                #{actualTrader.rank}
              </div>

              <TraderCard {...actualTrader} />
            </motion.div>
          );
        })}
      </div>

      {/* Rest of Leaderboard */}
      <div className="space-y-3">
        {filteredTraders.slice(3).map((trader, index) => (
          <motion.div
            key={trader.handle}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-surface-700 rounded-xl border border-surface-600 p-4 hover:bg-surface-600/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-black font-bold text-sm">
                #{trader.rank}
              </div>

              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-black font-bold">
                {trader.handle.slice(0, 2).toUpperCase()}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-text-default">@{trader.handle}</h3>
                <p className="text-sm text-muted">AUM ${trader.aum}</p>
              </div>

              <div className="text-right mr-4">
                <div className={clsx(
                  'text-lg font-mono font-semibold',
                  trader.pnl >= 0 ? 'text-success' : 'text-danger'
                )}>
                  {trader.pnl >= 0 ? '+' : ''}{trader.pnl}%
                </div>
                <div className="text-sm text-muted">
                  {trader.winRate}% win rate
                </div>
              </div>

              <Button variant="primary" size="sm">
                Copy
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};