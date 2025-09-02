import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { Copy, Gift, Share2, TrendingUp, Trophy, Users } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';

export const Referrals: React.FC = () => {
  const [copied, setCopied] = useState(false);

  // Placeholder data - will be replaced with backend data when endpoints are available
  const referralCode = 'APTORA-KING123';
  const referralLink = `https://aptora.com/ref/${referralCode}`;

  const stats = {
    totalReferred: 0,
    totalEarned: 0,
    currentTier: 'Bronze',
    nextTier: 'Silver',
    progressToNext: 0,
  };

  const recentReferrals: any[] = [];

  const tiers = [
    { name: 'Bronze', commission: '15%', requirement: '5 referrals' },
    { name: 'Silver', commission: '20%', requirement: '15 referrals' },
    { name: 'Gold', commission: '25%', requirement: '30 referrals' },
    { name: 'Platinum', commission: '30%', requirement: '50 referrals' },
  ];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-default mb-2">Referrals & Rewards</h1>
        <p className="text-muted">
          Earn commission from your referrals' trading fees. The more you refer, the higher your rates.
        </p>
      </div>

      {/* Referral Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary/20 via-accent/20 to-purple-500/20 rounded-2xl p-6 border border-primary/30"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto">
            <Gift className="w-8 h-8 text-black" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-text-default mb-2">Your Referral Code</h2>
            <div className="bg-bg-800 rounded-lg p-4 border border-surface-600">
              <div className="text-2xl font-mono font-bold text-primary mb-2">
                {referralCode}
              </div>
              <div className="text-sm text-muted font-mono break-all">
                {referralLink}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              variant="primary"
              onClick={handleCopy}
              icon={Copy}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <Button variant="secondary" icon={Share2}>
              Share
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-700 rounded-xl p-4 border border-surface-600">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted">Total Referred</span>
          </div>
          <div className="text-2xl font-bold text-text-default">{stats.totalReferred}</div>
        </div>

        <div className="bg-surface-700 rounded-xl p-4 border border-surface-600">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-4 h-4 text-success" />
            <span className="text-sm text-muted">Total Earned</span>
          </div>
          <div className="text-2xl font-mono font-bold text-success">
            ${stats.totalEarned.toFixed(2)}
          </div>
        </div>

        <div className="bg-surface-700 rounded-xl p-4 border border-surface-600">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-warning" />
            <span className="text-sm text-muted">Current Tier</span>
          </div>
          <div className="text-xl font-bold text-warning">{stats.currentTier}</div>
        </div>

        <div className="bg-surface-700 rounded-xl p-4 border border-surface-600">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span className="text-sm text-muted">Commission Rate</span>
          </div>
          <div className="text-xl font-bold text-accent">25%</div>
        </div>
      </div>

      {/* Progress to Next Tier */}
      <div className="bg-surface-700 rounded-xl p-4 border border-surface-600">
        <div className="flex justify-between items-center mb-3">
          <span className="font-medium text-text-default">Progress to {stats.nextTier}</span>
          <span className="text-sm text-muted">{stats.progressToNext}%</span>
        </div>
        <div className="w-full bg-bg-800 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.progressToNext}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-primary to-accent"
          />
        </div>
        <div className="flex justify-between text-xs text-muted mt-2">
          <span>{stats.totalReferred} referrals</span>
          <span>50 needed for {stats.nextTier}</span>
        </div>
      </div>

      {/* Commission Tiers */}
      <div>
        <h2 className="text-lg font-semibold text-text-default mb-4">Commission Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={clsx(
                'bg-surface-700 rounded-xl p-4 border transition-colors',
                tier.current
                  ? 'border-primary bg-primary/5'
                  : 'border-surface-600'
              )}
            >
              <div className="text-center space-y-2">
                <h3 className={clsx(
                  'font-semibold',
                  tier.current ? 'text-primary' : 'text-text-default'
                )}>
                  {tier.name}
                  {tier.current && <span className="ml-1 text-xs">(Current)</span>}
                </h3>
                <div className="text-lg font-bold text-success">{tier.commission}</div>
                <div className="text-xs text-muted">{tier.requirement}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Referrals */}
      <div>
        <h2 className="text-lg font-semibold text-text-default mb-4">Recent Referrals</h2>
        <div className="space-y-3">
          {recentReferrals.map((referral, index) => (
            <motion.div
              key={referral.handle}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-surface-700 rounded-xl p-4 border border-surface-600"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-black font-bold text-sm">
                    {referral.handle.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-text-default">@{referral.handle}</div>
                    <div className="text-sm text-muted">{referral.date}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-semibold text-success">
                    +${referral.commission.toFixed(2)}
                  </div>
                  <div className={clsx(
                    'text-xs px-2 py-1 rounded',
                    referral.status === 'active'
                      ? 'bg-success/20 text-success'
                      : 'bg-warning/20 text-warning'
                  )}>
                    {referral.status}
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