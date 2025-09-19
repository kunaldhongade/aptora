import React, { ReactNode, useEffect, useState } from 'react';
import { AptosWalletProvider } from './AptosWalletProvider';
import { FallbackWalletProvider } from './FallbackWalletProvider';

interface SmartWalletProviderProps {
    children: ReactNode;
}

/**
 * Smart wallet provider that tries Aptos wallet first,
 * then falls back to a no-wallet mode if initialization fails
 */
export const SmartWalletProvider: React.FC<SmartWalletProviderProps> = ({ children }) => {
    const [useWallet, setUseWallet] = useState(true);
    const [hasInitialized, setHasInitialized] = useState(false);

    useEffect(() => {
        // Listen for wallet initialization errors
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            if (event.reason?.message?.includes('Hex characters are invalid') ||
                event.reason?.message?.includes('Cannot access') ||
                event.reason?.message?.includes('hd') ||
                event.reason?.message?.includes('wallet')) {
                console.warn('Wallet initialization failed, switching to fallback mode');
                setUseWallet(false);
                setHasInitialized(true);
                event.preventDefault();
            }
        };

        const handleError = (event: ErrorEvent) => {
            if (event.message?.includes('Hex characters are invalid') ||
                event.message?.includes('Cannot access') ||
                event.message?.includes('hd')) {
                console.warn('Wallet error detected, switching to fallback mode');
                setUseWallet(false);
                setHasInitialized(true);
                event.preventDefault();
            }
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        window.addEventListener('error', handleError);

        // Set a timeout to initialize if no errors occur
        const timeout = setTimeout(() => {
            if (!hasInitialized) {
                setHasInitialized(true);
            }
        }, 1000);

        return () => {
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
            window.removeEventListener('error', handleError);
            clearTimeout(timeout);
        };
    }, [hasInitialized]);

    // Show loading while determining wallet availability
    if (!hasInitialized) {
        return (
            <div className="min-h-screen bg-bg-900 text-text-default flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted">Initializing wallet...</p>
                </div>
            </div>
        );
    }

    if (useWallet) {
        return <AptosWalletProvider>{children}</AptosWalletProvider>;
    } else {
        return <FallbackWalletProvider>{children}</FallbackWalletProvider>;
    }
};
