import React, { useState } from 'react';
import BottomNav from './components/layout/BottomNav';
import Header from './components/layout/Header';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Markets from './pages/Markets';
import Referrals from './pages/Referrals';
import Trade from './pages/Trade';
import Vaults from './pages/Vaults';
import './styles/globals.css';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trade' | 'markets' | 'vaults' | 'referrals'>('dashboard');

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
        <Header />
        <main className="pb-20">
          {renderContent()}
        </main>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </AuthProvider>
  );
}

export default App;