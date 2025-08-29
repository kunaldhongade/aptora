import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { VaultCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { clsx } from 'clsx';

const mockVaults = [
  { 
    name: 'Conservative Growth', 
    apy: '12.4%', 
    tvl: '45.2M', 
    riskLevel: 'low' as const, 
    tags: ['Stable', 'DCA', 'Long-term'],
    description: 'Low-risk strategy focusing on steady growth through dollar-cost averaging and trend following.'
  },
  { 
    name: 'Alpha Hunter', 
    apy: '34.7%', 
    tvl: '12.8M', 
    riskLevel: 'high' as const, 
    tags: ['Momentum', 'Swing', 'AI'],
    description: 'High-frequency momentum strategy powered by machine learning algorithms.'
  },
  { 
    name: 'Yield Farmer', 
    apy: '18.9%', 
    tvl: '23.1M', 
    riskLevel: 'medium' as const, 
    tags: ['Arbitrage', 'Funding'],
    description: 'Captures funding rate arbitrage opportunities across multiple exchanges.'
  },
  { 
    name: 'Range Master', 
    apy: '15.6%', 
    tvl: '8.7M', 
    riskLevel: 'medium' as const, 
    tags: ['Range', 'Grid'],
    description: 'Automated grid trading strategy optimized for sideways markets.'
  },
];

export const Vaults: React.FC = () => {
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('all');

  const riskFilters = [
    { id: 'all', label: 'All Risk Levels' },
    { id: 'low', label: 'Low Risk' },
    { id: 'medium', label: 'Medium Risk' },
    { id: 'high', label: 'High Risk' },
  ];

  const strategyFilters = [
    { id: 'all', label: 'All Strategies' },
    { id: 'stable', label: 'Stable' },
    { id: 'momentum', label: 'Momentum' },
    { id: 'arbitrage', label: 'Arbitrage' },
  ];

  const filteredVaults = mockVaults.filter(vault => {
    if (selectedRisk !== 'all' && vault.riskLevel !== selectedRisk) return false;
    if (selectedStrategy !== 'all') {
      const hasStrategy = vault.tags.some(tag => 
        tag.toLowerCase().includes(selectedStrategy.toLowerCase())
      );
      if (!hasStrategy) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-default mb-2">Vaults</h1>
        <p className="text-muted mb-6">
          Automated trading strategies managed by top performers. Deposit and earn passive returns.
        </p>
        
        {/* Filters */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-text-default mb-2">Risk Level</h3>
            <div className="flex flex-wrap gap-2">
              {riskFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedRisk(filter.id)}
                  className={clsx(
                    'px-3 py-1.5 text-sm rounded-lg transition-colors',
                    selectedRisk === filter.id
                      ? 'bg-primary text-black'
                      : 'bg-surface-700 text-muted hover:text-text-default border border-surface-600'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-text-default mb-2">Strategy Type</h3>
            <div className="flex flex-wrap gap-2">
              {strategyFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedStrategy(filter.id)}
                  className={clsx(
                    'px-3 py-1.5 text-sm rounded-lg transition-colors',
                    selectedStrategy === filter.id
                      ? 'bg-accent text-black'
                      : 'bg-surface-700 text-muted hover:text-text-default border border-surface-600'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Vault Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVaults.map((vault, index) => (
          <motion.div
            key={vault.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="bg-surface-700 rounded-2xl border border-surface-600 p-6 h-full flex flex-col">
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-text-default mb-2">{vault.name}</h3>
                  <p className="text-sm text-muted line-clamp-2">{vault.description}</p>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  {vault.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 text-xs bg-accent/20 text-accent rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted">APY</span>
                    <span className="text-xl font-mono font-bold text-success">{vault.apy}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted">TVL</span>
                    <span className="font-mono text-text-default">${vault.tvl}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted">Risk</span>
                    <span className={clsx(
                      'text-sm font-medium capitalize px-2 py-1 rounded',
                      vault.riskLevel === 'low' && 'bg-success/20 text-success',
                      vault.riskLevel === 'medium' && 'bg-warning/20 text-warning',
                      vault.riskLevel === 'high' && 'bg-danger/20 text-danger'
                    )}>
                      {vault.riskLevel}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 space-y-2">
                <Button variant="primary" size="md" className="w-full">
                  Deposit
                </Button>
                <Button variant="ghost" size="sm" className="w-full">
                  View Details
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};