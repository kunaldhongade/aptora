import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { Dashboard } from './pages/Dashboard';
import { Markets } from './pages/Markets';
import { Trade } from './pages/Trade';
import { Leaderboard } from './pages/Leaderboard';
import { Vaults } from './pages/Vaults';
import { Referrals } from './pages/Referrals';
import './styles/globals.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'markets':
        return <Markets />;
      case 'trade':
        return <Trade />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'vaults':
        return <Vaults />;
      case 'referrals':
        return <Referrals />;
      case 'portfolio':
        return <div className="text-center py-12 text-muted">Portfolio page coming soon...</div>;
      case 'settings':
        return <div className="text-center py-12 text-muted">Settings page coming soon...</div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-bg-900 text-text-default">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      
      <main className="container mx-auto px-4 py-6 pb-20 md:pb-6 max-w-7xl">
        {renderCurrentPage()}
      </main>
      
      <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />
    </div>
  );
}

export default App;