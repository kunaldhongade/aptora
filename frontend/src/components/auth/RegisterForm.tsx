import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/api';

export const RegisterForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [usernameMessage, setUsernameMessage] = useState<string>('');

    const { register } = useAuth();

    // Debounced username availability check
    const checkUsernameAvailability = useCallback(
        async (username: string) => {
            if (username.length < 3) {
                setUsernameStatus('idle');
                setUsernameMessage('');
                return;
            }

            setUsernameStatus('checking');
            setUsernameMessage('Checking availability...');

            try {
                const result = await apiClient.checkUsernameAvailability(username);
                if (result.available) {
                    setUsernameStatus('available');
                    setUsernameMessage('Username is available! ✅');
                } else {
                    setUsernameStatus('taken');
                    setUsernameMessage('Username is already taken ❌');
                }
            } catch (error) {
                setUsernameStatus('idle');
                setUsernameMessage('Error checking username');
            }
        },
        []
    );

    // Debounce username checking
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (username.length >= 3) {
                checkUsernameAvailability(username);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [username, checkUsernameAvailability]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (usernameStatus !== 'available') {
            setError('Please choose an available username');
            return;
        }

        setIsLoading(true);

        try {
            console.log('Submitting registration with referralCode:', referralCode); // Debug log
            await register(email, username, password, referralCode || undefined);
            // Redirect or handle successful registration
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-text-default mb-6 text-center">Join Aptora</h2>

            {error && (
                <div className="mb-4 p-3 bg-danger/20 border border-danger/30 rounded-lg text-danger text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-text-default mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-surface-600 border border-surface-500 rounded-lg text-text-default placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Enter your email"
                    />
                </div>

                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-text-default mb-2">
                        Username
                    </label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        minLength={3}
                        maxLength={50}
                        className={`w-full px-3 py-2 bg-surface-600 border rounded-lg text-text-default placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary ${usernameStatus === 'available'
                            ? 'border-green-500 focus:border-green-500'
                            : usernameStatus === 'taken'
                                ? 'border-red-500 focus:border-red-500'
                                : usernameStatus === 'checking'
                                    ? 'border-yellow-500 focus:border-yellow-500'
                                    : 'border-surface-500 focus:border-primary'
                            }`}
                        placeholder="Choose a username"
                    />
                    {usernameMessage && (
                        <div className={`mt-2 text-sm ${usernameStatus === 'available'
                            ? 'text-green-500'
                            : usernameStatus === 'taken'
                                ? 'text-red-500'
                                : usernameStatus === 'checking'
                                    ? 'text-yellow-500'
                                    : 'text-muted'
                            }`}>
                            {usernameMessage}
                        </div>
                    )}
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-text-default mb-2">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-3 py-2 bg-surface-600 border border-surface-500 rounded-lg text-text-default placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Create a password"
                    />
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-default mb-2">
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-surface-600 border border-surface-500 rounded-lg text-text-default placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Confirm your password"
                    />
                </div>

                <div>
                    <label htmlFor="referralCode" className="block text-sm font-medium text-text-default mb-2">
                        Referral Code (Optional)
                    </label>
                    <input
                        type="text"
                        id="referralCode"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-600 border border-surface-500 rounded-lg text-text-default placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Enter referral code if you have one"
                    />
                    <p className="mt-1 text-xs text-muted">
                        Get rewards when your friends sign up using your code!
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-primary text-black font-semibold rounded-lg transition-all duration-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-900 hover:bg-primary-600 shadow-sm hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>
            </form>

            <div className="mt-4 text-center">
                <p className="text-sm text-muted">
                    Already have an account?{' '}
                    <button className="text-primary hover:text-primary/80 font-medium">
                        Login
                    </button>
                </p>
            </div>
        </div>
    );
};
