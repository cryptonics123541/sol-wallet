import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { Connection, Keypair } from '@solana/web3.js';

require('@solana/wallet-adapter-react-ui/styles.css');

export default function WalletContextProvider({ children }) {
  // Using multiple mainnet fallback endpoints
  const endpoint = "https://solana-mainnet.phantom.tech/";
  
  const connection = new Connection(endpoint, {
    commitment: 'confirmed',
    wsEndpoint: "wss://solana-mainnet.phantom.tech/",
  });

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}