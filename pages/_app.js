import '../styles/globals.css';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import ClientWalletProvider from '../components/WalletProvider';

// Required for Wallet Adapter UI styling
require('@solana/wallet-adapter-react-ui/styles.css');

function MyApp({ Component, pageProps }) {
    return (
        <ClientWalletProvider>
            <WalletModalProvider>
                <Component {...pageProps} />
            </WalletModalProvider>
        </ClientWalletProvider>
    );
}

export default MyApp;