// pages/_app.js
import '../styles/globals.css';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import ClientWalletProvider from '../components/WalletProvider';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
    return (
        <>
            <Head>
                <title>Sol Token Burner</title>
                <meta name="description" content="A secure tool for burning Solana tokens" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                
                {/* Phantom dApp Metadata */}
                <meta name="title" content="Sol Token Burner" />
                <meta name="og:title" content="Sol Token Burner" />
                <meta name="og:description" content="A secure tool for burning Solana tokens" />
                <meta name="og:image" content="/icon.png" />
            </Head>
            <ClientWalletProvider>
                <Component {...pageProps} />
            </ClientWalletProvider>
        </>
    );
}

export default MyApp;