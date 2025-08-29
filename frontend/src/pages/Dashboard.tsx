import clsx from 'clsx';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Users, Wallet } from 'lucide-react';
import React from 'react';
import { Button } from '../components/ui/Button';
import { TraderCard, VaultCard } from '../components/ui/Card';

export const Dashboard: React.FC = () => {
  const marketTickers = [
    { symbol: 'BTC', price: '64,250', change: 2.34 },
    { symbol: 'ETH', price: '3,421', change: -1.23 },
    { symbol: 'SOL', price: '156', change: 5.67 },
    { symbol: 'DOGE', price: '0.142', change: 12.45 },
  ];

  const topTraders = [
    { handle: 'cryptoking', pnl: 23.5, winRate: 78, aum: '2.4M' },
    { handle: 'degentrader', pnl: 18.2, winRate: 65, aum: '1.8M' },
    { handle: 'yieldmaster', pnl: 15.8, winRate: 82, aum: '5.1M' },
  ];

  const featuredVaults = [
    { name: 'Conservative Growth', apy: '12.4%', tvl: '45.2M', riskLevel: 'low' as const, tags: ['Stable', 'DCA'] },
    { name: 'Alpha Hunter', apy: '34.7%', tvl: '12.8M', riskLevel: 'high' as const, tags: ['Momentum', 'Swing'] },
  ];

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
            {topTraders.map((trader, index) => (
              <motion.div
                key={trader.handle}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex-shrink-0 w-72"
              >
                <TraderCard {...trader} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Vaults */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-default">Featured Vaults</h2>
          <Button variant="ghost" size="sm" iconPosition="right" icon={ArrowRight}>
            Explore All
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {featuredVaults.map((vault, index) => (
            <motion.div
              key={vault.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <VaultCard {...vault} />
            </motion.div>
          ))}
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