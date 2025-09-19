import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Wallet, X } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/SimpleWalletProvider';
import { Button } from '../ui/Button';

interface WalletConnectProps {
    className?: string;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const { user, setWalletAddress, isAuthenticated } = useAuth();
    const { connect, disconnect, account, connected } = useWallet();

    const handleConnect = async () => {
        try {
            await connect();
            setIsOpen(false);

            // Set wallet address in auth context
            if (account?.address && isAuthenticated && user && !user.wallet_address) {
                await setWalletAddress(account.address);
            }
        } catch (error) {
            console.error('Failed to connect wallet:', error);
        }
    };

    const handleDisconnect = async () => {
        try {
            await disconnect();
        } catch (error) {
            console.error('Failed to disconnect wallet:', error);
        }
    };

    const copyAddress = async () => {
        if (account?.address) {
            await navigator.clipboard.writeText(account.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatAddress = (address: string) => {
        if (!address || address.length < 10) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    if (connected && account) {
        return (
            <div className={`relative ${className}`}>
                <Button
                    variant="primary"
                    size="sm"
                    icon={Wallet}
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2"
                >
                    <span className="hidden sm:inline">
                        {formatAddress(account.address)}
                    </span>
                </Button>

                <AnimatePresence>
                    {isOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                                onClick={() => setIsOpen(false)}
                            />

                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                className="absolute right-0 top-full mt-2 w-80 bg-surface-700 border border-surface-600 rounded-xl shadow-2xl z-50"
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                                                <Wallet className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-text-default">Wallet Connected</h3>
                                                <p className="text-xs text-muted">Ready to use</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="p-2 text-muted hover:text-text-default hover:bg-surface-600 rounded-lg transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 bg-surface-600 rounded-xl">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="text-xs text-muted mb-1">Wallet Address</p>
                                                    <p className="font-mono text-sm text-text-default break-all">
                                                        {account.address}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={copyAddress}
                                                    className="ml-3 p-2 text-muted hover:text-text-default hover:bg-surface-500 rounded-lg transition-colors"
                                                >
                                                    {copied ? (
                                                        <Check className="w-4 h-4 text-success" />
                                                    ) : (
                                                        <Copy className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleDisconnect}
                                            className="w-full bg-danger/10 hover:bg-danger/20 text-danger border-danger/20"
                                        >
                                            Disconnect Wallet
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            <Button
                variant="ghost"
                size="sm"
                icon={Wallet}
                onClick={handleConnect}
                className="flex items-center gap-2"
            >
                <span className="hidden sm:inline">Connect Wallet</span>
            </Button>
        </div>
    );
};
