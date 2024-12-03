import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createBurnInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import LandGrid from '../components/LandGrid';
import Head from 'next/head';

export default function Home() {
    const { connection } = useConnection();
    const wallet = useWallet();
    const { publicKey, signTransaction } = wallet;
    const [balance, setBalance] = useState(0);
    const [tokenBalance, setTokenBalance] = useState(null);
    const [burnAmount, setBurnAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

    const SPECIFIC_TOKEN = new PublicKey('6Ynt9SHxVKpkdGBVxtkbQewJ3PHyHCCF4QGNWKQypump');

    // Token management functions...
    const fetchBalances = async () => {
        if (!publicKey) return;
        try {
            const solBalance = await connection.getBalance(publicKey);
            setBalance(solBalance / LAMPORTS_PER_SOL);

            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
                programId: TOKEN_PROGRAM_ID,
            });

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
        }
    };

    const burnToken = async () => {
        if (!tokenBalance || !burnAmount) return;
        setLoading(true);
        try {
            const tokenAccountAddress = await getAssociatedTokenAddress(SPECIFIC_TOKEN, publicKey);
            const burnInstruction = createBurnInstruction(
                tokenAccountAddress,
                SPECIFIC_TOKEN,
                publicKey,
                Math.floor(parseFloat(burnAmount) * Math.pow(10, tokenBalance.decimals))
            );

            const transaction = new Transaction().add(burnInstruction);
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            const signedTransaction = await signTransaction(transaction);
            const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
                skipPreflight: false,
                preflightCommitment: 'finalized',
            });

            await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'finalized');
            await fetchBalances();
            setBurnAmount('');
            setIsTokenModalOpen(false);
        } catch (error) {
            console.error('Error burning token:', error);
            alert(`Error burning token: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (wallet.connected && publicKey) {
            fetchBalances();
        }
    }, [wallet.connected, publicKey]);

    return (
        <>
            <Head>
                <title>Land Grid | Modern Plot Marketplace</title>
            </Head>
            <div className="min-h-screen bg-gray-50">
                {/* Sticky Header */}
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

                {/* Main Content */}
                <main className="py-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <LandGrid />
                    </div>
                </main>

                {/* Token Modal */}
                {isTokenModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full m-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">Manage Tokens</h2>
                                <button onClick={() => setIsTokenModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <span className="text-2xl">×</span>
                                </button>
                            </div>
                            
                            {publicKey && (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Wallet Address:</p>
                                        <p className="font-mono text-sm break-all">{publicKey.toString()}</p>
                                        <p className="text-sm text-gray-600 mt-2">SOL Balance:</p>
                                        <p className="font-semibold">{balance.toFixed(4)} SOL</p>
                                    </div>
                                    
                                    {tokenBalance ? (
                                        <div>
                                            <p className="text-sm text-gray-600">Token Balance:</p>
                                            <p className="font-semibold">{tokenBalance.amount}</p>
                                            
                                            <div className="mt-4">
                                                <input
                                                    type="number"
                                                    value={burnAmount}
                                                    onChange={(e) => setBurnAmount(e.target.value)}
                                                    placeholder="Amount to burn"
                                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500"
                                                    min="0"
                                                    max={tokenBalance.amount}
                                                />
                                                <button
                                                    onClick={burnToken}
                                                    disabled={!burnAmount || loading}
                                                    className="w-full mt-2 p-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                                >
                                                    {loading ? 'Processing...' : 'Burn Tokens'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-600">No specific token found in wallet</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}