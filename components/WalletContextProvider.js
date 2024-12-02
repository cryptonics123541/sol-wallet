import { useMemo } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl, Connection } from '@solana/web3.js';

require('@solana/wallet-adapter-react-ui/styles.css');

export default function WalletContextProvider({ children }) {
  // Using a more reliable RPC endpoint
  const endpoint = "https://api.mainnet-beta.solana.com";
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  );

  // Configure the connection
  const config = {
    commitment: 'confirmed',
    wsEndpoint: "wss://api.mainnet-beta.solana.com",
    confirmTransactionInitialTimeout: 60000
  };

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