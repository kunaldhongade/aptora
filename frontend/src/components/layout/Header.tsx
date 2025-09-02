import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Menu, 
  X, 
  Home, 
  TrendingUp, 
  Users, 
  Vault, 
  Gift, 
  User,
  Settings as SettingsIcon,
  Wallet,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'markets', label: 'Markets', icon: TrendingUp },
  { id: 'leaderboard', label: 'Leaderboard', icon: Users },
  { id: 'vaults', label: 'Vaults', icon: Vault },
  { id: 'referrals', label: 'Referrals', icon: Gift },
  { id: 'portfolio', label: 'Portfolio', icon: User },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <>
      <header className="bg-surface-700 border-b border-surface-600">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold text-text-default">Aptora</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    currentPage === item.id
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted hover:text-text-default hover:bg-surface-600'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" icon={Wallet}>
                <span className="hidden sm:inline">Connect</span>
              </Button>
              
              {/* User Menu */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <span className="text-muted">Welcome,</span>
                  <span className="text-text-default font-medium">{user?.username || 'User'}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  icon={LogOut}
                  onClick={logout}
                  className="text-muted hover:text-danger"
                >
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-muted hover:text-text-default"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-surface-700 border-b border-surface-600 overflow-hidden"
          >
            <nav className="px-4 py-2 space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={clsx(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                    currentPage === item.id
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted hover:text-text-default hover:bg-surface-600'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};