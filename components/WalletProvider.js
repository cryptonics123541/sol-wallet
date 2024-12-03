// components/WalletProvider.js
import { useMemo } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

export default function ClientWalletProvider({ children }) {
    const network = WalletAdapterNetwork.Mainnet;
    const endpoint = process.env.NEXT_PUBLIC_RPC_URL;

    const wallets = useMemo(
        () => [],  // Empty array since Phantom is now a standard wallet
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}