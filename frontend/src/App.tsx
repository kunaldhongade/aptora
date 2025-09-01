import React, { useState } from 'react';
import { BottomNav } from './components/layout/BottomNav';
import { Header } from './components/layout/Header';
import { AuthProvider } from './contexts/AuthContext';
import { Dashboard } from './pages/Dashboard';
import { Markets } from './pages/Markets';
import { Referrals } from './pages/Referrals';
import Trade from './pages/Trade';
import { Vaults } from './pages/Vaults';
import './styles/globals.css';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trade' | 'markets' | 'vaults' | 'referrals'>('dashboard');

  const handleNavigate = (page: string) => {
    if (page === 'dashboard' || page === 'trade' || page === 'markets' || page === 'vaults' || page === 'referrals') {
      setActiveTab(page);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'trade':
        return <Trade />;
      case 'markets':
        return <Markets />;
      case 'vaults':
        return <Vaults />;
      case 'referrals':
        return <Referrals />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-900 text-white">
        <Header currentPage={activeTab} onNavigate={handleNavigate} />
        <main className="pb-20">
          {renderContent()}
        </main>
        <BottomNav currentPage={activeTab} onNavigate={handleNavigate} />
      </div>
    </AuthProvider>
  );
}

export default App;