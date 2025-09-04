import clsx from 'clsx';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Users, Wallet } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { TraderCard, VaultCard } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, MarketResponse } from '../lib/api';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [markets, setMarkets] = useState<MarketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMarkets = async () => {
      try {
        setLoading(true);
        const marketsData = await apiClient.getMarkets();
        setMarkets(marketsData);
      } catch (err) {
        setError('Failed to load markets data');
      } finally {
        setLoading(false);
      }
    };

    loadMarkets();
  }, []);

  // Convert markets to ticker format with real prices
  const [marketTickers, setMarketTickers] = useState<Array<{ symbol: string; price: string; change: string }>>([]);

  useEffect(() => {
    const loadMarketPrices = async () => {
      if (markets.length === 0) return;

      try {
        const tickers = await Promise.all(
          markets.slice(0, 4).map(async (market) => {
            try {
              const priceData = await apiClient.getMarketPrice(market.symbol);

              return {
                symbol: market.symbol,
                price: priceData.price.toFixed(2),
                change: "0.00", // TODO: Get real change data from API
              };
            } catch (err) {
              // Skip this market if API fails
              console.error(`Failed to get price for ${market.symbol}:`, err);
              return null; // Filter out failed markets
            }
          })
        );
        setMarketTickers(tickers.filter(ticker => ticker !== null));
      } catch (err) {
        console.error('Failed to load market prices:', err);
      }
    };

    loadMarketPrices();
  }, [markets]);

  // Load top traders from referral leaderboard
  const [topTraders, setTopTraders] = useState<Array<{ handle: string; pnl: number; winRate: number; aum: string; isFollowing?: boolean }>>([]);
  const [tradersLoading, setTradersLoading] = useState(false);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadTopTraders = async () => {
      setTradersLoading(true);
      try {
        const [leaderboard, followingData] = await Promise.all([
          apiClient.getReferralLeaderboard(3),
          user?.username ? apiClient.getFollowing(user.username) : Promise.resolve([])
        ]);

        const followingSet = new Set(followingData.map(u => u.username));
        setFollowing(followingSet);

        const traders = leaderboard.map((entry, index) => ({
          handle: entry.username,
          pnl: entry.total_rewards || 0,
          winRate: Math.floor(Math.random() * 30) + 70, // Mock win rate since not available
          aum: `${(entry.referral_count * 1000).toFixed(1)}K`, // Mock AUM based on referral count
          isFollowing: followingSet.has(entry.username)
        }));
        setTopTraders(traders);
      } catch (err) {
        console.error('Failed to load top traders:', err);
        // Fallback to empty array
        setTopTraders([]);
      } finally {
        setTradersLoading(false);
      }
    };

    loadTopTraders();
  }, [user]);

  const handleToggleFollow = async (username: string) => {
    console.log('Follow button clicked for:', username);

    // Prevent self-follow
    if (username === user?.username) {
      console.error('Cannot follow yourself');
      return;
    }

    try {
      const isCurrentlyFollowing = following.has(username);
      console.log('Currently following:', isCurrentlyFollowing);

      if (isCurrentlyFollowing) {
        console.log('Unfollowing user:', username);
        await apiClient.unfollowUser(username);
        setFollowing(prev => {
          const newSet = new Set(prev);
          newSet.delete(username);
          return newSet;
        });
      } else {
        console.log('Following user:', username);
        await apiClient.followUser(username);
        setFollowing(prev => new Set(prev).add(username));
      }

      // Update the trader's follow status
      setTopTraders(prev => prev.map(trader =>
        trader.handle === username
          ? { ...trader, isFollowing: !isCurrentlyFollowing }
          : trader
      ));

      console.log('Follow status updated successfully');
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      // TODO: Add toast notification for error
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-muted">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-red-400">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Ticker */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 pb-2">
          {marketTickers.map((ticker, index) => (
            <motion.div
              key={ticker.symbol}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex-shrink-0 bg-surface-700 rounded-xl p-3 border border-surface-600 min-w-[140px]"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-black text-xs font-bold">
                  {ticker.symbol.slice(0, 1)}
                </div>
                <span className="font-medium text-text-default">{ticker.symbol}</span>
              </div>
              <div className="text-lg font-mono font-semibold text-text-default">
                ${ticker.price}
              </div>
              <div className={clsx(
                'text-sm font-medium',
                ticker.change >= 0 ? 'text-success' : 'text-danger'
              )}>
                {ticker.change >= 0 ? '+' : ''}{ticker.change}%
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-text-default mb-3">
          Trade smarter with <span className="text-primary">Aptora</span>
        </h1>
        <p className="text-muted mb-6 max-w-md mx-auto">
          Advanced perpetual futures trading powered by Kana Labs.
          Copy top traders or manage your own strategies.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" icon={Wallet}>
            Deposit Funds
          </Button>
          <Button variant="secondary" size="lg" icon={TrendingUp}>
            Start Trading
          </Button>
          <Button variant="ghost" size="lg" icon={Users}>
            Copy Traders
          </Button>
        </div>
      </motion.div>

      {/* Top Traders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-default">Top Traders</h2>
          <Button variant="ghost" size="sm" iconPosition="right" icon={ArrowRight}>
            View All
          </Button>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 pb-2">
            {tradersLoading ? (
              <div className="flex gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex-shrink-0 w-72 bg-surface-700 rounded-xl p-4 border border-surface-600 animate-pulse">
                    <div className="h-4 bg-surface-600 rounded mb-2"></div>
                    <div className="h-6 bg-surface-600 rounded mb-2"></div>
                    <div className="h-4 bg-surface-600 rounded"></div>
                  </div>
                ))}
              </div>
            ) : topTraders.length > 0 ? (
              topTraders.map((trader, index) => (
                <motion.div
                  key={trader.handle}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-shrink-0 w-72"
                >
                  <TraderCard
                    {...trader}
                    onToggleFollow={() => handleToggleFollow(trader.handle)}
                  />
                </motion.div>
              ))
            ) : (
              <div className="flex-shrink-0 w-full bg-surface-700 rounded-xl p-8 border border-surface-600 text-center">
                <p className="text-muted">No top traders to display yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-default">Recent Activity</h2>
          <Button variant="ghost" size="sm" iconPosition="right" icon={ArrowRight}>
            View All
          </Button>
        </div>

        <div className="bg-surface-700 rounded-xl p-4 border border-surface-600">
          <p className="text-muted text-center py-8">
            No recent activity to display. Start trading to see your activity here.
          </p>
        </div>
      </div>

      {/* Referral Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl p-6 border border-primary/30"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-default mb-1">
              Earn 25% Commission
            </h3>
            <p className="text-muted text-sm">
              Refer friends and earn from their trading fees
            </p>
          </div>
          <Button variant="primary">
            Get Started
          </Button>
        </div>
      </motion.div>
    </div>
  );
};