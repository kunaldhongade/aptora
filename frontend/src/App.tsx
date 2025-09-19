import React from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { BottomNav } from './components/layout/BottomNav';
import { Header } from './components/layout/Header';
import { PageLoading } from './components/ui/LoadingAnimation';
import { AptosWalletProvider } from './contexts/AptosWalletProvider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './styles/globals.css';
import { LazyWrapper } from './utils/lazyLoad';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 App Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-900 text-text-default flex items-center justify-center">
          <div className="text-center p-8 bg-surface-700 rounded-xl border border-surface-600 max-w-md">
            <h2 className="text-xl font-bold text-danger mb-4">Something went wrong</h2>
            <p className="text-muted mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary text-black rounded-lg font-semibold hover:bg-primary/90"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lazy load all pages
const Auth = React.lazy(() => import('./pages/Auth').then(m => ({ default: m.Auth })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Leaderboard = React.lazy(() => import('./pages/Leaderboard').then(m => ({ default: m.Leaderboard })));
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

// Auth Route Component - redirects if already authenticated
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoading text="Initializing Aptora..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Main App Layout Component
const AppLayout: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'trade' | 'orders' | 'vaults' | 'referrals' | 'leaderboard' | 'social' | 'profile'>('dashboard');

  const handleNavigate = (page: string) => {
    if (page === 'dashboard' || page === 'trade' || page === 'orders' || page === 'vaults' || page === 'referrals' || page === 'leaderboard' || page === 'social' || page === 'profile') {
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
    <div className="min-h-screen bg-bg-900 text-text-default overflow-x-hidden flex flex-col">
      <Header currentPage={activeTab} onNavigate={handleNavigate} />
      <main className="px-5 py-3 w-full flex-1 flex flex-col">
        {renderContent()}
      </main>
      <BottomNav currentPage={activeTab} onNavigate={handleNavigate} />
    </div>
  );
};

function App() {
  // Add debug logging for production
  React.useEffect(() => {
    if (import.meta.env.PROD) {
      console.log('🚀 Aptora Frontend Starting...');
      console.log('Environment:', import.meta.env.MODE);
      console.log('API URL:', import.meta.env.VITE_API_BASE_URL);
      console.log('Base URL:', import.meta.env.VITE_BASE_URL);
    }
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <AptosWalletProvider>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/auth" element={
                <AuthRoute>
                  <LazyWrapper>
                    <Auth />
                  </LazyWrapper>
                </AuthRoute>
              } />

              {/* Protected Routes */}
              <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
              <Route path="/trade" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
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
    </ErrorBoundary>
  );
}

export default App;