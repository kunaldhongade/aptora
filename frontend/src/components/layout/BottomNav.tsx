import React from 'react';
import { clsx } from 'clsx';
import { Home, TrendingUp, Users, Vault, User } from 'lucide-react';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const bottomNavItems = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'trade', label: 'Trade', icon: TrendingUp },
  { id: 'markets', label: 'Markets', icon: TrendingUp },
  { id: 'vaults', label: 'Vaults', icon: Vault },
  { id: 'referrals', label: 'Refs', icon: User },
];

export const BottomNav: React.FC<BottomNavProps> = ({ currentPage, onNavigate }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-700 border-t border-surface-600">
      <div className="flex items-center">
        {bottomNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={clsx(
              'flex-1 flex flex-col items-center gap-1 py-3 transition-colors',
              currentPage === item.id
                ? 'text-primary'
                : 'text-muted hover:text-text-default'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};