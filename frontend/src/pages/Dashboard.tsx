import clsx from 'clsx';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Users, Wallet } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { TraderCard } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, MarketResponse } from '../lib/api';
import { getBaseSymbol, getTokenInfo } from '../utils/tokenIcons';

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [markets, setMarkets] = useState<MarketResponse[]>([]);
  const [walletBalance, setWalletBalance] = useState<{ balance: number; asset: string }[]>([]);
  const [profileBalance, setProfileBalance] = useState<{
    totalBalance: number;
    availableBalance: number;
    usedMargin: number;
    realizedPnl: number;
    unrealizedPnl: number;
    timestamp: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load markets
        if (markets.length === 0) {
          const marketsData = await apiClient.getMarkets();
          setMarkets(marketsData);
        }

        // Load wallet data if user has wallet address
        if (user?.wallet_address) {
          try {
            const [walletBalanceData, profileBalanceData] = await Promise.all([
              apiClient.getWalletAccountBalance(user.wallet_address),
              apiClient.getProfileBalanceSnapshot(user.wallet_address)
            ]);
            setWalletBalance(walletBalanceData);
            setProfileBalance(profileBalanceData);
          } catch (walletError) {
            console.error('Failed to load wallet data:', walletError);
            // Don't set error for wallet data as it's optional
          }
        }
      } catch (err) {
        setError('Failed to load data');
        console.error('Dashboard data loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.wallet_address, markets.length]);

  // Convert markets to ticker format with real prices
  const [marketTickers, setMarketTickers] = useState<Array<{ symbol: string; price: string; change: string }>>([]);

  useEffect(() => {
    const loadMarketPrices = async () => {
      if (markets.length === 0) return;

      try {
        // Only load prices if we don't have tickers yet
        if (marketTickers.length === 0) {
          const tickers = await Promise.all(
            markets.slice(0, 4).map(async (market) => {
              try {
                const priceData = await apiClient.getMarketPrice(market.symbol);

                return {
                  symbol: market.symbol,
                  price: priceData.price.toFixed(2),
                  change: "N/A", // Change data not available from current API
                };
              } catch (err) {
                // Skip this market if API fails
                console.error(`Failed to get price for ${market.symbol}:`, err);
                return null; // Filter out failed markets
              }
            })
          );
          setMarketTickers(tickers.filter(ticker => ticker !== null));
        }
      } catch (err) {
        console.error('Failed to load market prices:', err);
      }
    };

    loadMarketPrices();
  }, [markets, marketTickers.length]);

  // Load top traders from referral leaderboard
  const [topTraders, setTopTraders] = useState<Array<{ handle: string; pnl: number; winRate: number | null; aum: string | null; isFollowing?: boolean }>>([]);
  const [tradersLoading, setTradersLoading] = useState(false);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadTopTraders = async () => {
      // Only load if we don't have traders yet
      if (topTraders.length === 0) {
        setTradersLoading(true);
        try {
          const [leaderboard, followingData] = await Promise.all([
            apiClient.getReferralLeaderboard(3),
            user?.username ? apiClient.getFollowing(user.username) : Promise.resolve([])
          ]);

          const followingSet = new Set(followingData.map(u => u.username));
          setFollowing(followingSet);

          const traders = leaderboard.map((entry) => ({
            handle: entry.username,
            pnl: entry.total_rewards || 0,
            winRate: null, // Not available from API
            aum: null, // Not available from API
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
      }
    };

    loadTopTraders();
  }, [user, topTraders.length]);

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Loading dashboard data...</p>
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
    <div className="w-full max-w-none space-y-6">
      {/* Smooth Marquee Market Ticker */}
      <div className="relative overflow-hidden bg-surface-700/50 rounded-2xl border border-surface-600/50 py-4">
        {/* Gradient overlays for smooth fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-surface-700/50 to-transparent z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-surface-700/50 to-transparent z-10"></div>

        <div className="flex">
          {/* First set of tickers */}
          <motion.div
            className="flex gap-6 pr-6"
            animate={{ x: [0, -100 * marketTickers.length] }}
            transition={{
              duration: 60, // 60 seconds for full cycle
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {[...marketTickers, ...marketTickers, ...marketTickers].map((ticker, index) => {
              const tokenInfo = getTokenInfo(getBaseSymbol(ticker.symbol));
              return (
                <div
                  key={`${ticker.symbol}-${index}`}
                  className="flex-shrink-0 bg-surface-700 rounded-xl p-4 border border-surface-600 min-w-[220px] shadow-sm hover:shadow-glow transition-all duration-300"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <img
                        src={tokenInfo.icon}
                        alt={tokenInfo.name}
                        className="w-10 h-10 rounded-full shadow-lg flex-shrink-0"
                        onError={(e) => {
                          // Fallback to letter if icon fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-black text-sm font-bold shadow-glow flex-shrink-0">
                                ${ticker.symbol.slice(0, 1)}
                              </div>
                            `;
                          }
                        }}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-text-default text-sm truncate">
                          {ticker.symbol}
                        </div>
                        <div className="text-xs text-muted truncate">
                          {tokenInfo.name}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 ml-3">
                      <div className="text-lg font-mono font-bold text-text-default">
                        ${ticker.price}
                      </div>
                      <div className={clsx(
                        'text-sm font-semibold flex items-center justify-end gap-1',
                        parseFloat(ticker.change) >= 0 ? 'text-success' : 'text-danger'
                      )}>
                        <span className="text-xs">
                          {parseFloat(ticker.change) >= 0 ? '▲' : '▼'}
                        </span>
                        {parseFloat(ticker.change) >= 0 ? '+' : ''}{ticker.change}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Impressive Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-bg-800 to-primary/10 border border-primary/10 shadow-glow mb-8"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/3 to-transparent"></div>

        {/* Content Grid */}
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center p-8 lg:p-12">

          {/* Left Content */}
          <div className="space-y-6 lg:pr-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-6">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-primary">Live Trading Platform</span>
              </div>

              <h1 className="text-4xl lg:text-6xl font-bold text-text-default mb-4 leading-tight">
                Trade Smarter with{' '}
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent font-press-start text-3xl lg:text-4xl block mt-2">
                  Aptora
                </span>
              </h1>

              <p className="text-xl text-muted mb-8 leading-relaxed max-w-lg">
                Advanced perpetual futures trading powered by <span className="text-primary font-semibold">Kana Labs</span>.
                Copy top traders, manage strategies, and maximize your profits with cutting-edge tools.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                size="lg"
                icon={TrendingUp}
                onClick={() => onNavigate?.('trade')}
                className="bg-primary hover:bg-primary/90 text-black font-bold shadow-glow text-lg px-8 py-4"
              >
                Start Trading Now
              </Button>
              <Button
                variant="ghost"
                size="lg"
                icon={Users}
                onClick={() => onNavigate?.('social')}
                className="border-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 text-lg px-8 py-4"
              >
                Copy Top Traders
              </Button>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="grid grid-cols-3 gap-6 pt-8 border-t border-surface-600/50"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted">Trading</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">0%</div>
                <div className="text-sm text-muted">Gas Fees</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">100+</div>
                <div className="text-sm text-muted">Markets</div>
              </div>
            </motion.div>
          </div>

          {/* Right Content - Hero Image */}
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            className="relative flex justify-center items-center lg:justify-end"
          >
            <div className="relative">
              {/* Glow Effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-3xl scale-110"></div>
              <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-primary/15 rounded-full blur-xl animate-pulse delay-1000"></div>

              {/* Hero SVG */}
              <div className="relative z-10 w-full max-w-lg">
                <img
                  src="/hero_img.svg"
                  alt="Aptora Trading Platform"
                  className="w-full h-auto filter drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-8 right-8 bg-primary/20 backdrop-blur-sm rounded-2xl p-3 border border-primary/30"
              >
                <TrendingUp className="w-6 h-6 text-primary" />
              </motion.div>

              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-12 left-8 bg-primary/20 backdrop-blur-sm rounded-2xl p-3 border border-primary/30"
              >
                <Wallet className="w-6 h-6 text-primary" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-900 to-transparent"></div>
      </motion.div>

      {/* Wallet Balance Section */}
      {user?.wallet_address && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-text-default mb-4">Wallet Balance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Wallet Account Balance */}
            <div className="bg-surface-700 rounded-xl p-4 border border-surface-600">
              <h3 className="text-sm font-medium text-muted mb-3">Account Balance</h3>
              {walletBalance.length > 0 ? (
                <div className="space-y-2">
                  {walletBalance.map((balance, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-text-default">{balance.asset}</span>
                      <span className="font-mono text-text-default">{balance.balance.toFixed(6)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No balance data available</p>
              )}
            </div>

            {/* Profile Balance Snapshot */}
            <div className="bg-surface-700 rounded-xl p-4 border border-surface-600">
              <h3 className="text-sm font-medium text-muted mb-3">Trading Balance</h3>
              {profileBalance ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-text-default">Total</span>
                    <span className="font-mono text-text-default">{profileBalance.totalBalance?.toFixed(6) || '0.000000'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-default">Available</span>
                    <span className="font-mono text-success">{profileBalance.availableBalance?.toFixed(6) || '0.000000'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-default">Used Margin</span>
                    <span className="font-mono text-warning">{profileBalance.usedMargin?.toFixed(6) || '0.000000'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-default">Unrealized PnL</span>
                    <span className={`font-mono ${(profileBalance.unrealizedPnl || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                      {profileBalance.unrealizedPnl?.toFixed(6) || '0.000000'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-muted">No trading balance data available</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Top Traders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-default">Top Traders</h2>
          <Button variant="ghost" size="sm" iconPosition="right" icon={ArrowRight}>
            View All
          </Button>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 pb-2 min-w-max">
            {tradersLoading ? (
              <div className="flex gap-4 min-w-max">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex-shrink-0 w-80 bg-surface-700 rounded-xl p-4 border border-surface-600 animate-pulse">
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
                  className="flex-shrink-0 w-80"
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
        className="hidden md:block bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl p-6 border border-primary/30 "
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
            Refer
          </Button>
        </div>
      </motion.div>
    </div>
  );
};