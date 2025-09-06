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
    // Configure the wallets you want to support
    const wallets = [
        new PetraWallet(),
        new PontemWallet(),
        new MartianWallet(),
        new FewchaWallet(),
    ];

    return (
        <AptosWalletAdapterProvider
            plugins={wallets}
            autoConnect={true}
            onError={(error) => {
                console.error('Aptos Wallet Error:', error);
            }}
        >
            {children}
        </AptosWalletAdapterProvider>
    );
};
