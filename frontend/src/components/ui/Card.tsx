import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { Star, TrendingDown, TrendingUp } from 'lucide-react';
import React from 'react';
import { Button } from './Button';

interface CardProps {
  variant?: 'market' | 'vault' | 'trader';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

interface MarketCardProps {
  symbol: string;
  price: string;
  change24h: number;
  volume: string;
  funding?: string;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  onClick?: () => void;
}

interface VaultCardProps {
  name: string;
  apy: string;
  tvl: string;
  riskLevel: 'low' | 'medium' | 'high';
  tags: string[];
  onClick?: () => void;
}

interface TraderCardProps {
  handle: string;
  avatar?: string;
  pnl: number;
  winRate: number;
  aum: string;
  isFollowing?: boolean;
  onToggleFollow?: () => void;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  onClick,
  hoverable = true,
}) => {
  return (
    <motion.div
      whileHover={hoverable ? { y: -2 } : undefined}
      className={clsx(
        'bg-surface-700 rounded-2xl border border-surface-600 shadow-card',
        'transition-all duration-200',
        hoverable && 'hover:shadow-glow cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

export const MarketCard: React.FC<MarketCardProps> = ({
  symbol,
  price,
  change24h,
  volume,
  funding,
  isFavorited = false,
  onToggleFavorite,
  onClick,
}) => {
  return (
    <Card onClick={onClick} className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-black font-bold text-sm">
            {symbol.slice(0, 2)}
          </div>
          <div>
            <h3 className="font-semibold text-text-default">{symbol}</h3>
            <p className="text-sm text-muted">Perpetual</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.();
          }}
          className="text-muted hover:text-warning transition-colors"
        >
          <Star className={clsx('w-4 h-4', isFavorited && 'fill-warning text-warning')} />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-lg font-mono font-semibold">${price}</span>
          <div className={clsx(
            'flex items-center gap-1 text-sm font-medium',
            change24h >= 0 ? 'text-success' : 'text-danger'
          )}>
            {change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
          </div>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted">Volume 24h</span>
          <span className="font-mono">${volume}</span>
        </div>

        {funding && (
          <div className="flex justify-between text-sm">
            <span className="text-muted">Funding</span>
            <span className="font-mono text-primary">{funding}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export const VaultCard: React.FC<VaultCardProps> = ({
  name,
  apy,
  tvl,
  riskLevel,
  tags,
  onClick,
}) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-success';
      case 'medium': return 'text-warning';
      case 'high': return 'text-danger';
      default: return 'text-muted';
    }
  };

  return (
    <Card onClick={onClick} className="p-4">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-text-default mb-1">{name}</h3>
          <div className="flex gap-2">
            {tags.slice(0, 2).map((tag) => (
              <span key={tag} className="px-2 py-1 text-xs bg-accent/20 text-accent rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted">APY</span>
            <span className="text-lg font-mono font-semibold text-success">{apy}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted">TVL</span>
            <span className="font-mono">${tvl}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted">Risk</span>
            <span className={clsx('text-sm font-medium capitalize', getRiskColor(riskLevel))}>
              {riskLevel}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export const TraderCard: React.FC<TraderCardProps> = ({
  handle,
  avatar,
  pnl,
  winRate,
  aum,
  isFollowing = false,
  onToggleFollow,
  onClick,
}) => {
  return (
    <Card onClick={onClick} className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {avatar ? (
              <img src={avatar} alt={handle} className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-black font-bold">
                {handle.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-text-default">@{handle}</h3>
              <p className="text-sm text-muted">AUM ${aum}</p>
            </div>
          </div>

          <Button
            variant={isFollowing ? 'ghost' : 'primary'}
            size="sm"
            onClick={() => {
              onToggleFollow?.();
            }}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-muted">7D PnL</span>
            <div className={clsx(
              'text-lg font-mono font-semibold',
              pnl >= 0 ? 'text-success' : 'text-danger'
            )}>
              {pnl >= 0 ? '+' : ''}{pnl.toFixed(1)}%
            </div>
          </div>

          <div>
            <span className="text-sm text-muted">Win Rate</span>
            <div className="text-lg font-mono font-semibold text-text-default">
              {winRate.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};