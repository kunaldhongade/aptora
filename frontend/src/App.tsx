import React from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { BottomNav } from './components/layout/BottomNav';
import { Header } from './components/layout/Header';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Leaderboard } from './pages/Leaderboard';
import { Markets } from './pages/Markets';
import { Orders } from './pages/Orders';
import { Profile } from './pages/Profile';
import { Referrals } from './pages/Referrals';
import { Social } from './pages/Social';
import Trade from './pages/Trade';
import { Vaults } from './pages/Vaults';
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
  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'trade' | 'markets' | 'orders' | 'vaults' | 'referrals' | 'leaderboard' | 'social' | 'profile'>('dashboard');

  const handleNavigate = (page: string) => {
    if (page === 'dashboard' || page === 'trade' || page === 'markets' || page === 'orders' || page === 'vaults' || page === 'referrals' || page === 'leaderboard' || page === 'social' || page === 'profile') {
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
      case 'orders':
        return <Orders />;
      case 'vaults':
        return <Vaults />;
      case 'referrals':
        return <Referrals />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'social':
        return <Social />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white ">
      <Header currentPage={activeTab} onNavigate={handleNavigate} />
      <main className="px-5 py-3 max-w-screen-xl mx-auto" >
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
          <Route path="/social" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;