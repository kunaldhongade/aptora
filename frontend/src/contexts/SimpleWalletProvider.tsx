import React, { createContext, ReactNode, useContext, useState } from 'react';

// Simple wallet context without problematic Aptos SDK
interface SimpleWalletContextType {
    connected: boolean;
    account: { address: string } | null;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    wallets: never[];
    network: null;
}

const SimpleWalletContext = createContext<SimpleWalletContextType>({
    connected: false,
    account: null,
    connect: async () => { },
    disconnect: async () => { },
    wallets: [],
    network: null,
});

export const useWallet = () => {
    const context = useContext(SimpleWalletContext);
    if (!context) {
        throw new Error('useWallet must be used within a SimpleWalletProvider');
    }
    return context;
};

interface SimpleWalletProviderProps {
    children: ReactNode;
}

export const SimpleWalletProvider: React.FC<SimpleWalletProviderProps> = ({ children }) => {
    const [connected, setConnected] = useState(false);
    const [account, setAccount] = useState<{ address: string } | null>(null);

    const connect = async () => {
        try {
            // Simple wallet connection simulation
            // In a real app, you'd integrate with window.aptos or other wallet APIs directly
            if (typeof window !== 'undefined' && (window as any).aptos) {
                const response = await (window as any).aptos.connect();
                setAccount({ address: response.address });
                setConnected(true);
                console.log('Wallet connected:', response.address);
            } else {
                // Simulate connection for demo purposes
                const demoAddress = '0x1234567890abcdef1234567890abcdef12345678';
                setAccount({ address: demoAddress });
                setConnected(true);
                console.log('Demo wallet connected:', demoAddress);
            }
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            throw error;
        }
    };

    const disconnect = async () => {
        try {
            if (typeof window !== 'undefined' && (window as any).aptos) {
                await (window as any).aptos.disconnect();
            }
            setAccount(null);
            setConnected(false);
            console.log('Wallet disconnected');
        } catch (error) {
            console.error('Failed to disconnect wallet:', error);
            // Always disconnect on error
            setAccount(null);
            setConnected(false);
        }
    };

    const value: SimpleWalletContextType = {
        connected,
        account,
        connect,
        disconnect,
        wallets: [],
        network: null,
    };

    return (
        <SimpleWalletContext.Provider value={value}>
            {children}
        </SimpleWalletContext.Provider>
    );
};
