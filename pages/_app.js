// pages/_app.js
import '../styles/globals.css';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import ClientWalletProvider from '../components/WalletProvider';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
    return (
        <>
            <Head>
                {/* Essential Metadata */}
                <title>Sol Token Burner</title>
                <meta name="description" content="Secure Solana token burning application" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                
                {/* Security and Trust Signals */}
                <meta property="og:title" content="Sol Token Burner" />
                <meta property="og:type" content="website" />
                <meta property="og:description" content="Secure Solana token burning application" />
                
                {/* CSP Headers */}
                <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; connect-src 'self' https://*.solana.com https://*.helius-rpc.com;" />
            </Head>
            <ClientWalletProvider>
                <Component {...pageProps} />
            </ClientWalletProvider>
        </>
    );
}

export default MyApp;