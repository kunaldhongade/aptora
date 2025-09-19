import React, { ReactNode } from 'react';

interface FallbackWalletProviderProps {
    children: ReactNode;
}

/**
 * Fallback wallet provider for when Aptos wallet initialization fails
 * This allows the app to still function without wallet connectivity
 */
export const FallbackWalletProvider: React.FC<FallbackWalletProviderProps> = ({ children }) => {
    console.warn('Using fallback wallet provider - wallet functionality disabled');
    return <>{children}</>;
};
