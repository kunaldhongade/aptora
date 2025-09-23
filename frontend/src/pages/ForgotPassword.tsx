import { motion } from 'framer-motion';
import { ArrowLeft, Mail } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { apiClient } from '../lib/api';

export const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await apiClient.forgotPassword(email);
            setIsSubmitted(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send reset email');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-surface-800 to-surface-900 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-surface-700 border border-surface-600 rounded-xl p-8 text-center">
                        <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Mail className="w-8 h-8 text-success" />
                        </div>

                        <h1 className="text-2xl font-bold text-text-default mb-4">
                            Check Your Email
                        </h1>

                        <p className="text-muted mb-6">
                            If an account with <strong>{email}</strong> exists, we've sent you a password reset link.
                        </p>

                        <p className="text-sm text-muted mb-6">
                            The link will expire in 1 hour for security reasons.
                        </p>

                        <div className="space-y-3">
                            <Link to="/auth">
                                <Button variant="primary" className="w-full">
                                    Back to Login
                                </Button>
                            </Link>

                            <button
                                onClick={() => setIsSubmitted(false)}
                                className="text-primary hover:text-primary/80 text-sm font-medium"
                            >
                                Try a different email
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-surface-800 to-surface-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-surface-700 border border-surface-600 rounded-xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-text-default mb-2">
                            Forgot Password?
                        </h1>
                        <p className="text-muted">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-danger/20 border border-danger/30 rounded-lg text-danger text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-text-default mb-2">
                                Email Address
                            </label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={setEmail}
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full"
                            loading={isLoading}
                            disabled={!email}
                        >
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            to="/auth"
                            className="inline-flex items-center text-muted hover:text-text-default text-sm font-medium"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
