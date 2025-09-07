import { WalletReadyState } from '@aptos-labs/wallet-adapter-core';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Check,
    ChevronDown,
    Copy,
    Download,
    Wallet,
    X
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

interface WalletConnectProps {
    className?: string;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ className }) => {
    const {
        connect,
        disconnect,
        account,
        connected,
        wallets,
        network
    } = useWallet();

    const { user, setWalletAddress, isAuthenticated } = useAuth();

    // Log wallet connection status for debugging
    React.useEffect(() => {
        if (connected && account) {
            console.log('Wallet connected:', account);
        }
    }, [connected, account]);

    // Auto-set wallet address when wallet connects and user is authenticated
    React.useEffect(() => {
        if (connected && account && isAuthenticated && user && !user.wallet_address) {
            const walletAddress = getAddressString();
            if (walletAddress) {
                setWalletAddress(walletAddress).catch(error => {
                    console.error('Failed to set wallet address:', error);
                });
            }
        }
    }, [connected, account, isAuthenticated, user, setWalletAddress]);

    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleConnect = async (walletName: string) => {
        try {
            await connect(walletName);
            setIsOpen(false);
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            // You could add a toast notification here
        }
    };

    const handleDisconnect = async () => {
        try {
            await disconnect();
        } catch (error) {
            console.error('Failed to disconnect wallet:', error);
        }
    };

    const getAddressString = () => {
        if (!account?.address) return '';

        if (typeof account.address === 'string') {
            return account.address;
        } else if (account.address && typeof account.address === 'object' && account.address.toString) {
            return account.address.toString();
        } else {
            return String(account.address);
        }
    };

    const copyAddress = async () => {
        const addressString = getAddressString();
        if (addressString) {
            await navigator.clipboard.writeText(addressString);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatAddress = (address: string | undefined | any) => {
        if (!address) return '';

        // Handle different address formats
        let addressString = '';
        if (typeof address === 'string') {
            addressString = address;
        } else if (address && typeof address === 'object' && address.toString) {
            addressString = address.toString();
        } else {
            addressString = String(address);
        }

        // Ensure we have a valid address string
        if (!addressString || addressString.length < 10) return '';

        return `${addressString.slice(0, 6)}...${addressString.slice(-4)}`;
    };

    const getWalletIcon = () => {
        // You can add custom icons for each wallet here
        return <Wallet className="w-5 h-5" />;
    };

    const getWalletInstallUrl = (walletName: string) => {
        const urls: Record<string, string> = {
            'Petra': 'https://petra.app/',
            'Pontem': 'https://pontem.network/',
            'Martian': 'https://martianwallet.xyz/',
            'Fewcha': 'https://fewcha.app/',
        };
        return urls[walletName] || '#';
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
                        {formatAddress(getAddressString())}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                </Button>

                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Mobile overlay */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                                onClick={() => setIsOpen(false)}
                            />

                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:absolute md:right-0 md:top-full md:mt-2 md:inset-x-auto md:translate-y-0 w-auto md:w-80 lg:w-96 bg-slate-900 border border-surface-600 rounded-xl shadow-2xl z-50"
                            >
                                <div className="p-4 md:p-6 max-h-[80vh] overflow-y-auto">
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
                                            className="p-2 text-muted hover:text-text-default hover:bg-surface-700 rounded-lg transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 bg-gradient-to-r from-surface-700 to-surface-700/80 rounded-xl border border-surface-600">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="text-xs text-muted mb-1">Wallet Address</p>
                                                    <p className="font-mono text-sm text-text-default break-all">
                                                        {getAddressString()}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={copyAddress}
                                                    className="ml-3 p-2 text-muted hover:text-text-default hover:bg-surface-600 rounded-lg transition-colors flex-shrink-0"
                                                >
                                                    {copied ? (
                                                        <Check className="w-4 h-4 text-success" />
                                                    ) : (
                                                        <Copy className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-surface-700/50 rounded-xl border border-surface-600/50">
                                            <p className="text-xs text-muted mb-1">Network</p>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-success rounded-full"></div>
                                                <p className="text-sm text-text-default capitalize font-medium">
                                                    {network?.name || 'Unknown'}
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleDisconnect}
                                            className="w-full bg-danger/10 hover:bg-danger/20 text-danger border-danger/20 hover:border-danger/30"
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
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2"
            >
                <span className="hidden sm:inline">Connect</span>
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Mobile overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:absolute md:right-0 md:top-full md:mt-2 md:inset-x-auto md:translate-y-0 w-auto md:w-80 lg:w-96 bg-slate-900 border border-surface-600 rounded-xl shadow-2xl z-50"
                        >
                            <div className="p-4 md:p-6 max-h-[80vh] overflow-y-auto">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                                            <Wallet className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-text-default">Connect Wallet</h3>
                                            <p className="text-xs text-muted">Choose your preferred wallet</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 text-muted hover:text-text-default hover:bg-surface-700 rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {wallets.map((wallet) => {
                                        const isInstalled = wallet.readyState === WalletReadyState.Installed;
                                        const isNotDetected = wallet.readyState === WalletReadyState.NotDetected;

                                        return (
                                            <button
                                                key={wallet.name}
                                                onClick={() => isInstalled ? handleConnect(wallet.name) : null}
                                                disabled={!isInstalled}
                                                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 border ${isInstalled
                                                    ? 'bg-gradient-to-r from-surface-700 to-surface-700/80 hover:from-surface-600 hover:to-surface-600/80 text-text-default border-surface-600 hover:border-primary/30 hover:shadow-lg'
                                                    : 'bg-surface-700/30 text-muted cursor-not-allowed border-surface-600/30'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isInstalled ? 'bg-primary/20' : 'bg-surface-600/50'
                                                        }`}>
                                                        {getWalletIcon()}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-semibold text-sm">{wallet.name}</p>
                                                        <p className="text-xs text-muted">
                                                            {isInstalled ? 'Ready to connect' : 'Not installed'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {isNotDetected && (
                                                    <a
                                                        href={getWalletInstallUrl(wallet.name)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Download className="w-3 h-3" />
                                                        Install
                                                    </a>
                                                )}

                                                {isInstalled && (
                                                    <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                                                        <div className="w-2 h-2 bg-success rounded-full"></div>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-6 p-4 bg-gradient-to-r from-surface-700/30 to-surface-700/20 rounded-xl border border-surface-600/30">
                                    <p className="text-xs text-muted text-center leading-relaxed">
                                        By connecting a wallet, you agree to Aptora's Terms of Service and Privacy Policy.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
