import { motion } from 'framer-motion';
import React from 'react';
import { Button } from '../components/ui/Button';

// Vault data will be fetched from backend when vault endpoints are implemented
// For now, show a "Coming Soon" state

export const Vaults: React.FC = () => {

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-default mb-2">Vaults</h1>
        <p className="text-muted mb-6">
          Automated trading strategies managed by top performers. Deposit and earn passive returns.
        </p>

      </div>

      {/* Coming Soon Message */}
      <div className="text-center py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-text-default mb-2">Vaults Coming Soon</h3>
          <p className="text-muted mb-6">
            Automated trading strategies managed by top performers will be available soon.
            Deposit and earn passive returns with our curated vault system.
          </p>
          <Button variant="primary" disabled>
            Coming Soon
          </Button>
        </motion.div>
      </div>
    </div>
  );
};