import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { Copy, Gift, Share2, Trophy, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, ReferralLeaderboardEntry } from '../lib/api';

export const Referrals: React.FC = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [, setIsLoading] = useState(false);
  const [referralStats, setReferralStats] = useState({
    totalReferred: 0,
    totalEarned: 0,
    currentTier: 'Starter',
    nextTier: 'Bronze',
    progressToNext: 0,
  });
  const [recentReferrals, setRecentReferrals] = useState<{
    handle: string;
    date: string;
    commission: number;
    status: string;
  }[]>([]);
  const [, setLeaderboard] = useState<ReferralLeaderboardEntry[]>([]);
  const [referralCode, setReferralCode] = useState<string>('');

  const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:5173';
  const referralLink = referralCode ? `${baseUrl}/ref/${referralCode}` : '';

  const tiers = React.useMemo(() => [
    { name: 'Starter', commission: '10%', requirement: '0 referrals', current: referralStats.currentTier === 'Starter' },
    { name: 'Bronze', commission: '15%', requirement: '5 referrals', current: referralStats.currentTier === 'Bronze' },
    { name: 'Silver', commission: '20%', requirement: '15 referrals', current: referralStats.currentTier === 'Silver' },
    { name: 'Gold', commission: '25%', requirement: '30 referrals', current: referralStats.currentTier === 'Gold' },
    { name: 'Platinum', commission: '30%', requirement: '50 referrals', current: referralStats.currentTier === 'Platinum' },
  ], [referralStats.currentTier]);

  useEffect(() => {
    if (user?.username) {
      loadReferralData();
    }
  }, [user, loadReferralData]);

  const loadReferralData = React.useCallback(async () => {
    if (!user?.username) return;

    setIsLoading(true);
    try {
      const [profile, referralInfo, leaderboardData, referredUsers] = await Promise.all([
        apiClient.getUserProfile(user.username),
        apiClient.getReferralInfo(),
        apiClient.getReferralLeaderboard(10),
        apiClient.getReferredUsers(10, 0)
      ]);

      const referralCount = profile.referral_count || 0;
      const totalEarned = referralInfo.total_rewards || 0;
      const code = referralInfo.referral_code || user.username;

      // Set the referral code from API
      setReferralCode(code);

      // Calculate current tier and progress
      let currentTier = 'Starter';
      let nextTier = 'Bronze';
      let progressToNext = 0;

      if (referralCount >= 50) {
        currentTier = 'Platinum';
        nextTier = 'Platinum';
        progressToNext = 100;
      } else if (referralCount >= 30) {
        currentTier = 'Gold';
        nextTier = 'Platinum';
        progressToNext = ((referralCount - 30) / 20) * 100;
      } else if (referralCount >= 15) {
        currentTier = 'Silver';
        nextTier = 'Gold';
        progressToNext = ((referralCount - 15) / 15) * 100;
      } else if (referralCount >= 5) {
        currentTier = 'Bronze';
        nextTier = 'Silver';
        progressToNext = ((referralCount - 5) / 10) * 100;
      } else {
        currentTier = 'Starter';
        nextTier = 'Bronze';
        progressToNext = (referralCount / 5) * 100;
      }

      setReferralStats({
        totalReferred: referralCount,
        totalEarned,
        currentTier,
        nextTier,
        progressToNext: Math.min(progressToNext, 100)
      });

      // Tiers are now updated automatically via useMemo

      setLeaderboard(leaderboardData);

      // Transform referred users to match the expected format
      const recentReferralsData = referredUsers.map(user => ({
        handle: user.username,
        date: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown',
        commission: 0, // Commission calculation not yet implemented
        status: 'active'
      }));

      setRecentReferrals(recentReferralsData);

    } catch (error) {
      console.error('Failed to load referral data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Clean Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Gift className="w-6 h-6 text-accent" />
          <h1 className="text-3xl font-bold text-text-default">Referrals & Rewards</h1>
        </div>
        <p className="text-muted">Share Aptora and earn up to <span className="text-accent font-semibold">30% commission</span> from trading fees</p>
      </div>

      {/* Creative Referral Code + Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Creative Referral Code Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-accent/10 via-primary/5 to-accent/5 backdrop-blur-sm rounded-2xl p-6 border border-accent/20 hover:border-accent/40 transition-all duration-300 shadow-glow-green">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center">
                <Copy className="w-4 h-4 text-black" />
              </div>
              <span className="text-sm font-semibold text-accent uppercase tracking-wider">Your Link</span>
            </div>

            <div className="space-y-3">
              <div className="bg-bg-900/50 rounded-xl p-4 border border-surface-600/50">
                <div className="text-2xl font-mono font-bold text-primary mb-2 tracking-wider">
                  {referralCode}
                </div>
                <div className="text-xs text-muted font-mono truncate">
                  {referralLink}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCopy}
                  icon={Copy}
                  className="flex-1 bg-accent hover:bg-accent/90 text-black font-semibold"
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Share2}
                  className="border border-accent/30 text-accent hover:bg-accent/10"
                >
                  Share
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="bg-surface-700/50 backdrop-blur-sm rounded-2xl p-6 border border-surface-600/50 hover:border-accent/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-5 h-5 text-accent" />
              <span className="text-xs text-muted uppercase tracking-wider">Referred</span>
            </div>
            <div className="text-3xl font-bold text-text-default mb-1">{referralStats.totalReferred}</div>
            <div className="text-sm text-muted">Total Friends</div>
          </div>

          <div className="bg-surface-700/50 backdrop-blur-sm rounded-2xl p-6 border border-surface-600/50 hover:border-accent/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <Gift className="w-5 h-5 text-accent" />
              <span className="text-xs text-muted uppercase tracking-wider">Earned</span>
            </div>
            <div className="text-3xl font-mono font-bold text-accent mb-1">
              ${referralStats.totalEarned.toFixed(2)}
            </div>
            <div className="text-sm text-muted">Commission</div>
          </div>

          <div className="bg-surface-700/50 backdrop-blur-sm rounded-2xl p-6 border border-surface-600/50 hover:border-accent/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="text-xs text-muted uppercase tracking-wider">Tier</span>
            </div>
            <div className="text-2xl font-bold text-primary mb-1">{referralStats.currentTier}</div>
            <div className="text-sm text-muted">
              {referralStats.currentTier === 'Platinum' ? '30%' :
                referralStats.currentTier === 'Gold' ? '25%' :
                  referralStats.currentTier === 'Silver' ? '20%' :
                    referralStats.currentTier === 'Bronze' ? '15%' : '10%'} Rate
            </div>
          </div>
        </div>
      </motion.div>

      {/* Two Column Layout: Progress + Tiers */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Progress Section */}
        <div className="lg:col-span-1">
          <div className="bg-surface-700/50 backdrop-blur-sm rounded-2xl p-6 border border-surface-600/50 h-full">
            <h3 className="text-lg font-semibold text-text-default mb-4">
              {referralStats.currentTier === referralStats.nextTier ? 'Maximum Tier!' : `Progress to ${referralStats.nextTier}`}
            </h3>

            <div className="text-4xl font-bold text-accent mb-2">
              {referralStats.progressToNext.toFixed(0)}%
            </div>

            <p className="text-sm text-muted mb-6">
              {referralStats.currentTier === referralStats.nextTier
                ? 'You\'ve reached the highest tier!'
                : `${Math.max(0, (referralStats.nextTier === 'Bronze' ? 5 :
                  referralStats.nextTier === 'Silver' ? 15 :
                    referralStats.nextTier === 'Gold' ? 30 : 50) - referralStats.totalReferred)} more referrals needed`
              }
            </p>

            <div className="relative">
              <div className="w-full bg-bg-900 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${referralStats.progressToNext}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-accent to-primary rounded-full shadow-glow-green"
                />
              </div>
              <div className="flex justify-between text-xs text-muted mt-2">
                <span>{referralStats.totalReferred}</span>
                <span>{referralStats.nextTier === 'Bronze' ? '5' :
                  referralStats.nextTier === 'Silver' ? '15' :
                    referralStats.nextTier === 'Gold' ? '30' :
                      referralStats.nextTier === 'Platinum' ? '50' : '50'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Commission Tiers */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-text-default mb-1">Commission Tiers</h2>
            <p className="text-sm text-muted">Unlock higher rates as you grow</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className={clsx(
                  'relative rounded-xl p-4 border transition-all duration-300',
                  tier.current
                    ? 'bg-accent/5 border-accent shadow-glow-green scale-105'
                    : 'bg-surface-700/30 border-surface-600/50 hover:border-accent/30'
                )}
              >
                {tier.current && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <span className="bg-accent text-black text-xs font-bold px-2 py-1 rounded-full">
                      CURRENT
                    </span>
                  </div>
                )}

                <div className="text-center space-y-2">
                  <h3 className={clsx(
                    'text-sm font-bold',
                    tier.current ? 'text-accent' : 'text-text-default'
                  )}>
                    {tier.name}
                  </h3>

                  <div className={clsx(
                    'text-2xl font-bold',
                    tier.current ? 'text-accent' : 'text-primary'
                  )}>
                    {tier.commission}
                  </div>

                  <div className="text-xs text-muted">
                    {tier.requirement}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Recent Referrals Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-text-default mb-1">Recent Activity</h2>
            <p className="text-sm text-muted">Your latest referral achievements</p>
          </div>
          {recentReferrals.length > 0 && (
            <Button variant="ghost" className="text-muted hover:text-accent">
              View All ({recentReferrals.length + 5}+)
            </Button>
          )}
        </div>

        {recentReferrals.length === 0 ? (
          <div className="bg-surface-700/30 backdrop-blur-sm rounded-2xl p-12 border border-surface-600/50 text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-text-default mb-2">Ready to Start Earning?</h3>
            <p className="text-muted mb-6 max-w-md mx-auto">
              Share your referral link with friends and start earning commission from their trades
            </p>
            <Button
              variant="primary"
              onClick={handleCopy}
              icon={Copy}
              className="shadow-glow-green"
            >
              {copied ? 'Copied!' : 'Copy Referral Link'}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentReferrals.map((referral, index) => (
              <motion.div
                key={referral.handle}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className="bg-surface-700/50 backdrop-blur-sm rounded-xl p-4 border border-surface-600/50 hover:border-accent/30 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center text-black font-bold text-sm">
                    {referral.handle.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-text-default truncate">@{referral.handle}</div>
                    <div className="text-xs text-muted">Joined {referral.date}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-lg font-mono font-bold text-accent">
                    +${referral.commission.toFixed(2)}
                  </div>
                  <div className={clsx(
                    'text-xs font-medium px-2 py-1 rounded-full',
                    referral.status === 'active'
                      ? 'bg-accent/20 text-accent'
                      : 'bg-warning/20 text-warning'
                  )}>
                    {referral.status.toUpperCase()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};