// pages/_app.js
import '../styles/globals.css';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import ClientWalletProvider from '../components/WalletProvider';

function MyApp({ Component, pageProps }) {
    return (
        <ClientWalletProvider>
            <Component {...pageProps} />
        </ClientWalletProvider>
    );
}

export default MyApp;