import { useMemo } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { Connection } from '@solana/web3.js';

require('@solana/wallet-adapter-react-ui/styles.css');

export default function WalletContextProvider({ children }) {
  // Using RPC Pool endpoint
  const endpoint = "https://free.rpcpool.com";
  
  // Configure connection
  const config = {
    commitment: 'confirmed',
    disableRetryOnRateLimit: false,
    httpHeaders: {
      'Content-Type': 'application/json'
    }
  };

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint} config={config}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}