import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { Crown, Search, TrendingUp, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { apiClient, ReferralLeaderboardEntry } from '../lib/api';

export const Leaderboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'7d' | '30d' | 'all'>('all');
  const [leaderboard, setLeaderboard] = useState<ReferralLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sortOptions = [
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: 'all', label: 'All Time' },
  ] as const;

  useEffect(() => {
    loadLeaderboard();
  }, [sortBy]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getReferralLeaderboard(50);
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTraders = leaderboard.filter(trader =>
    trader.username.toLowerCase().includes(searchTerm.toLowerCase())
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

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Loading leaderboard...</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {filteredTraders.slice(0, 3).map((trader, index) => {
              const podiumOrder = [1, 0, 2]; // Second, First, Third for visual hierarchy
              const actualIndex = podiumOrder[index];
              const actualTrader = filteredTraders[actualIndex];

              if (!actualTrader) return null;

              return (
                <motion.div
                  key={actualTrader.username}
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
                    #{index + 1}
                  </div>

                  {/* Referral Trader Card */}
                  <div className="bg-surface-700 rounded-xl border border-surface-600 p-6 text-center">
                    <div className={clsx(
                      'w-20 h-20 rounded-full flex items-center justify-center text-black font-bold text-2xl mx-auto mb-4',
                      index === 0 && 'bg-warning',
                      index === 1 && 'bg-muted',
                      index === 2 && 'bg-orange-600 text-white'
                    )}>
                      {index === 0 && <Crown className="w-8 h-8" />}
                      {index > 0 && actualTrader.username.slice(0, 2).toUpperCase()}
                    </div>

                    <h3 className="text-xl font-bold text-text-default mb-2">@{actualTrader.username}</h3>

                    <div className="space-y-2 text-sm text-muted">
                      <div className="flex items-center justify-center gap-2">
                        <Users className="w-4 h-4" />
                        {actualTrader.referral_count} referrals
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        ${actualTrader.total_rewards.toFixed(2)} earned
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Rest of Leaderboard */}
          <div className="space-y-3">
            {filteredTraders.slice(3).map((trader, index) => (
              <motion.div
                key={trader.username}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-surface-700 rounded-xl border border-surface-600 p-4 hover:bg-surface-600/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-black font-bold text-sm">
                    #{index + 4}
                  </div>

                  <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-black font-bold">
                    {trader.username.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-text-default">@{trader.username}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {trader.referral_count} referrals
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        ${trader.total_rewards.toFixed(2)} earned
                      </span>
                    </div>
                  </div>

                  <div className="text-right mr-4">
                    <div className="text-lg font-mono font-semibold text-success">
                      {trader.referral_count}
                    </div>
                    <div className="text-sm text-muted">
                      referrals
                    </div>
                  </div>

                  <Button variant="primary" size="sm">
                    Copy
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};