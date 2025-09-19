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

    // Immediately catch any errors during component initialization
    React.useLayoutEffect(() => {
        const checkForWalletErrors = () => {
            try {
                // Try to access some common wallet-related globals that might cause issues
                if (typeof window !== 'undefined') {
                    // This is just a probe - if wallet libraries are broken, this might catch it
                    const hasWalletError = window.location.href.includes('error') ||
                        document.querySelector('script[src*="aptos"]')?.getAttribute('error');
                    if (hasWalletError) {
                        console.warn('Detected wallet error during initialization');
                        setUseWallet(false);
                        setHasInitialized(true);
                    }
                }
            } catch (error) {
                console.warn('Error during wallet initialization check:', error);
                setUseWallet(false);
                setHasInitialized(true);
            }
        };

        checkForWalletErrors();
    }, []);

    useEffect(() => {
        // Listen for wallet initialization errors
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const errorMessage = event.reason?.message || event.reason?.toString() || '';
            if (errorMessage.includes('Hex characters are invalid') ||
                errorMessage.includes('Cannot access') ||
                errorMessage.includes('before initialization') ||
                errorMessage.includes('hd') ||
                errorMessage.includes('vl') ||
                errorMessage.includes('wallet') ||
                errorMessage.includes('aptos')) {
                console.warn('Wallet initialization failed, switching to fallback mode:', errorMessage);
                event.preventDefault();
                // Use setTimeout to avoid setState during render
                setTimeout(() => {
                    setUseWallet(false);
                    setHasInitialized(true);
                }, 0);
            }
        };

        const handleError = (event: ErrorEvent) => {
            const errorMessage = event.message || event.error?.message || '';
            if (errorMessage.includes('Hex characters are invalid') ||
                errorMessage.includes('Cannot access') ||
                errorMessage.includes('before initialization') ||
                errorMessage.includes('hd') ||
                errorMessage.includes('vl') ||
                errorMessage.includes('aptos')) {
                console.warn('Wallet error detected, switching to fallback mode:', errorMessage);
                event.preventDefault();
                // Use setTimeout to avoid setState during render
                setTimeout(() => {
                    setUseWallet(false);
                    setHasInitialized(true);
                }, 0);
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
