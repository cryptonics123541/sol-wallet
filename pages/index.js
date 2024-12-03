import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createBurnInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import Head from 'next/head';
import LandGrid from '../components/LandGrid';
import TokenModal from '../components/TokenModal';

const SPECIFIC_TOKEN = new PublicKey('6Ynt9SHxVKpkdGBVxtkbQewJ3PHyHCCF4QGNWKQypump');

export default function Home() {
    const { connection } = useConnection();
    const { publicKey, signTransaction } = useWallet();
    const [balance, setBalance] = useState(0);
    const [tokenBalance, setTokenBalance] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
    const [error, setError] = useState('');

    const fetchBalances = useCallback(async () => {
        if (!publicKey) return;

        try {
            const [solBalance, tokenAccounts] = await Promise.all([
                connection.getBalance(publicKey),
                connection.getParsedTokenAccountsByOwner(publicKey, {
                    programId: TOKEN_PROGRAM_ID,
                })
            ]);

            setBalance(solBalance / LAMPORTS_PER_SOL);

            const specificToken = tokenAccounts.value.find(
                account => account.account.data.parsed.info.mint === SPECIFIC_TOKEN.toString()
            );

            if (specificToken) {
                setTokenBalance({
                    amount: specificToken.account.data.parsed.info.tokenAmount.uiAmount,
                    decimals: specificToken.account.data.parsed.info.tokenAmount.decimals,
                });
            }
        } catch (error) {
            console.error('Error fetching balances:', error);
            setError('Failed to fetch balances');
        }
    }, [publicKey, connection]);

    // Burn token function to be used by LandGrid
    const burnToken = useCallback(async (burnAmount) => {
        if (!tokenBalance || !burnAmount) return false;
        setLoading(true);
        setError('');

        try {
            const tokenAccountAddress = await getAssociatedTokenAddress(
                SPECIFIC_TOKEN,
                publicKey
            );

            const burnInstruction = createBurnInstruction(
                tokenAccountAddress,
                SPECIFIC_TOKEN,
                publicKey,
                Math.floor(parseFloat(burnAmount) * Math.pow(10, tokenBalance.decimals))
            );

            const transaction = new Transaction().add(burnInstruction);

            // Get latest blockhash and simulate transaction
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            // Simulate transaction before sending
            const simulation = await connection.simulateTransaction(transaction);
            if (simulation.value.err) {
                throw new Error('Transaction simulation failed');
            }

            const signedTransaction = await signTransaction(transaction);
            const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
                skipPreflight: false,
                preflightCommitment: 'finalized',
            });

            await connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight
            }, 'finalized');

            await fetchBalances();
            setIsTokenModalOpen(false);
            return true;
        } catch (error) {
            console.error('Error burning token:', error);
            setError(error.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, [tokenBalance, publicKey, connection, signTransaction, fetchBalances]);

    const handlePlotClick = useCallback((plotId) => {
        console.log(`Plot ${plotId} clicked`);
        // Add your plot click handling logic here
    }, []);

    useEffect(() => {
        if (publicKey) {
            fetchBalances();
        }
    }, [publicKey, fetchBalances]);

    return (
        <>
            <Head>
                <title>Land Grid | Modern Plot Marketplace</title>
                <meta name="description" content="A modern marketplace for digital land plots" />
            </Head>

            <div className="min-h-screen bg-gray-50">
                <header className="sticky top-0 bg-white shadow-sm z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <h1 className="text-xl font-semibold text-gray-900">Land Grid</h1>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => setIsTokenModalOpen(true)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Manage Tokens
                                </button>
                                <WalletMultiButton />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="py-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <LandGrid 
                            onPlotClick={handlePlotClick} 
                            burnToken={burnToken} // Pass the burnToken function here
                        />
                    </div>
                </main>

                <TokenModal
                    isOpen={isTokenModalOpen}
                    onClose={() => setIsTokenModalOpen(false)}
                    balance={balance}
                    tokenBalance={tokenBalance}
                    onBurn={burnToken}
                    loading={loading}
                    error={error}
                />
            </div>
        </>
    );
}
