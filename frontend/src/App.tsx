import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Markets } from './pages/Markets';
import { Referrals } from './pages/Referrals';
import Trade from './pages/Trade';
import { Vaults } from './pages/Vaults';
import { Leaderboard } from './pages/Leaderboard';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import './styles/globals.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Main App Layout Component
const AppLayout: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'trade' | 'markets' | 'vaults' | 'referrals' | 'leaderboard'>('dashboard');

  const handleNavigate = (page: string) => {
    if (page === 'dashboard' || page === 'trade' || page === 'markets' || page === 'vaults' || page === 'referrals' || page === 'leaderboard') {
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
      case 'leaderboard':
        return <Leaderboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header currentPage={activeTab} onNavigate={handleNavigate} />
      <main className="px-5 py-3">
        {renderContent()}
      </main>
      <BottomNav currentPage={activeTab} onNavigate={handleNavigate} />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/auth" element={<Auth />} />
          
          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/trade" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/markets" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/vaults" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/referrals" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;