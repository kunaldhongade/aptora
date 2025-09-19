import { Network } from '@aptos-labs/ts-sdk';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import React, { ReactNode } from 'react';

// Import wallet adapters for different wallets
import { MartianWallet } from '@martianwallet/aptos-wallet-adapter';
import { PontemWallet } from '@pontem/wallet-adapter-plugin';
import { FewchaWallet } from 'fewcha-plugin-wallet-adapter';
import { PetraWallet } from 'petra-plugin-wallet-adapter';

interface AptosWalletProviderProps {
    children: ReactNode;
}

export const AptosWalletProvider: React.FC<AptosWalletProviderProps> = ({ children }) => {
    // Configure the wallets you want to support with error handling
    const wallets = React.useMemo(() => {
        try {
            return [
                new PetraWallet(),
                new PontemWallet(),
                new MartianWallet(),
                new FewchaWallet(),
            ];
        } catch (error) {
            console.error('Error initializing wallets:', error);
            return [];
        }
    }, []);

    const handleError = React.useCallback((error: Error) => {
        console.error('Aptos Wallet Error:', error);
        // Don't throw the error in production, just log it
        if (import.meta.env.DEV) {
            console.warn('Wallet error in development mode');
        }
    }, []);

    // Add error boundary for wallet provider
    const [hasWalletError, setHasWalletError] = React.useState(false);

    React.useEffect(() => {
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            if (event.reason?.message?.includes('Hex characters are invalid') ||
                event.reason?.message?.includes('Cannot access') ||
                event.reason?.message?.includes('hd')) {
                console.warn('Wallet initialization error caught:', event.reason);
                setHasWalletError(true);
                event.preventDefault(); // Prevent the error from crashing the app
            }
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        return () => {
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);

    // If wallet has error, render children without wallet provider
    if (hasWalletError) {
        console.warn('Rendering app without wallet functionality due to initialization error');
        return <>{children}</>;
    }

    return (
        <AptosWalletAdapterProvider
            plugins={wallets}
            autoConnect={false} // Disable auto-connect to prevent initialization errors
            onError={handleError}
            dappConfig={{
                network: Network.TESTNET, // Explicitly set network
                mizuwallet: {
                    manifestURL: "https://assets.mizuwallet.com/dapp-config.json",
                },
            }}
        >
            {children}
        </AptosWalletAdapterProvider>
    );
};
