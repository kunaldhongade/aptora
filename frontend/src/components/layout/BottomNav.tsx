import { clsx } from 'clsx';
import { FileText, Home, TrendingUp, User, Users } from 'lucide-react';
import React from 'react';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const bottomNavItems = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'trade', label: 'Trade', icon: TrendingUp },
  { id: 'orders', label: 'Orders', icon: FileText },
  { id: 'social', label: 'Social', icon: Users },
  { id: 'referrals', label: 'Refs', icon: User },
];

export const BottomNav: React.FC<BottomNavProps> = ({ currentPage, onNavigate }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-700/95 backdrop-blur-sm border-t border-surface-600 z-50">
      <div className="flex items-center">
        {bottomNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={clsx(
              'flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-200',
              currentPage === item.id
                ? 'text-primary bg-primary/10'
                : 'text-muted hover:text-text-default hover:bg-surface-600/50'
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