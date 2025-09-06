import React from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { BottomNav } from './components/layout/BottomNav';
import { Header } from './components/layout/Header';
import { PageLoading } from './components/ui/LoadingAnimation';
import { AptosWalletProvider } from './contexts/AptosWalletProvider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './styles/globals.css';
import { LazyWrapper } from './utils/lazyLoad';

// Lazy load all pages
const Auth = React.lazy(() => import('./pages/Auth').then(m => ({ default: m.Auth })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Leaderboard = React.lazy(() => import('./pages/Leaderboard').then(m => ({ default: m.Leaderboard })));
const Markets = React.lazy(() => import('./pages/Markets').then(m => ({ default: m.Markets })));
const Orders = React.lazy(() => import('./pages/Orders').then(m => ({ default: m.Orders })));
const Profile = React.lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Referrals = React.lazy(() => import('./pages/Referrals').then(m => ({ default: m.Referrals })));
const Social = React.lazy(() => import('./pages/Social').then(m => ({ default: m.Social })));
const Trade = React.lazy(() => import('./pages/Trade'));
const Vaults = React.lazy(() => import('./pages/Vaults').then(m => ({ default: m.Vaults })));

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoading text="Initializing Aptora..." />;
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
        return (
          <LazyWrapper>
            <Dashboard onNavigate={handleNavigate} />
          </LazyWrapper>
        );
      case 'trade':
        return (
          <LazyWrapper>
            <Trade />
          </LazyWrapper>
        );
      case 'markets':
        return (
          <LazyWrapper>
            <Markets />
          </LazyWrapper>
        );
      case 'orders':
        return (
          <LazyWrapper>
            <Orders />
          </LazyWrapper>
        );
      case 'vaults':
        return (
          <LazyWrapper>
            <Vaults />
          </LazyWrapper>
        );
      case 'referrals':
        return (
          <LazyWrapper>
            <Referrals />
          </LazyWrapper>
        );
      case 'leaderboard':
        return (
          <LazyWrapper>
            <Leaderboard />
          </LazyWrapper>
        );
      case 'social':
        return (
          <LazyWrapper>
            <Social />
          </LazyWrapper>
        );
      case 'profile':
        return (
          <LazyWrapper>
            <Profile />
          </LazyWrapper>
        );
      default:
        return (
          <LazyWrapper>
            <Dashboard onNavigate={handleNavigate} />
          </LazyWrapper>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-x-hidden">
      <Header currentPage={activeTab} onNavigate={handleNavigate} />
      <main className="px-5 py-3 max-w-screen-xl mx-auto">
        {renderContent()}
      </main>
      <BottomNav currentPage={activeTab} onNavigate={handleNavigate} />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AptosWalletProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/auth" element={
              <LazyWrapper>
                <Auth />
              </LazyWrapper>
            } />

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
      </AptosWalletProvider>
    </Router>
  );
}

export default App;