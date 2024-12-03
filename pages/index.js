// pages/index.js
import { useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import LandGrid from '../components/LandGrid';
import Head from 'next/head';

export default function Home() {
    const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

    return (
        <>
            <Head>
                <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
            </Head>
            <div className="min-h-screen bg-black text-[#00FF00]" style={{ fontFamily: "'Press Start 2P', cursive" }}>
                {/* Retro Header */}
                <header className="sticky top-0 bg-black border-b-4 border-[#00FF00] z-40">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex justify-between items-center h-16">
                            <h1 className="text-xl text-[#00FF00] animate-pulse">{'>'} LAND GAME</h1>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => setIsTokenModalOpen(true)}
                                    className="px-4 py-2 border-2 border-[#00FF00] text-[#00FF00] hover:bg-[#00FF00] hover:text-black transition-colors"
                                >
                                    {'>'} TOKENS
                                </button>
                                <WalletMultiButton />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="container mx-auto py-8">
                    <LandGrid />
                </main>

                {/* Footer */}
                <footer className="border-t-4 border-[#00FF00] py-4 text-center">
                    <p className="text-sm text-[#00FF00]">{'>'} PRESS START TO BEGIN</p>
                </footer>
            </div>
        </>
    );
}