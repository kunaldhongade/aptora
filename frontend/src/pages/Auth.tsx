import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { Logo } from '../components/ui/Logo';
import { useAuth } from '../contexts/AuthContext';

export const Auth: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-surface-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Logo size="xl" showTagline={true} />
        </div>

        {/* Auth Tabs */}
        <div className="bg-surface-700 rounded-2xl border border-surface-600 p-1 mb-6">
          <div className="flex">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${activeTab === 'login'
                ? 'bg-primary text-white shadow-lg'
                : 'text-muted hover:text-text-default'
                }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${activeTab === 'register'
                ? 'bg-primary text-white shadow-lg'
                : 'text-muted hover:text-text-default'
                }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Auth Forms */}
        <div className="bg-surface-700 rounded-2xl border border-surface-600 p-6">
          {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
        </div>

        {/* Features */}
        <div className="mt-8 text-center">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-muted">
              <div className="text-primary text-lg mb-1">🚀</div>
              <div>Fast Trading</div>
            </div>
            <div className="text-muted">
              <div className="text-primary text-lg mb-1">🔒</div>
              <div>Secure</div>
            </div>
            <div className="text-muted">
              <div className="text-primary text-lg mb-1">💎</div>
              <div>Advanced</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
