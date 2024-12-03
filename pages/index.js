// pages/index.js
import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createBurnInstruction, getAssociatedTokenAddress } from '@solana/spl-token';

export default function Home() {
    const { connection } = useConnection();
    const wallet = useWallet();
    const { publicKey, signTransaction } = wallet;
    const [balance, setBalance] = useState(0);
    const [tokenBalance, setTokenBalance] = useState(null);
    const [burnAmount, setBurnAmount] = useState('');
    const [loading, setLoading] = useState(false);

    // Specific token address we're interested in
    const SPECIFIC_TOKEN = new PublicKey('6Ynt9SHxVKpkdGBVxtkbQewJ3PHyHCCF4QGNWKQypump');

    const fetchBalances = async () => {
        if (!publicKey) return;
        
        try {
            // Fetch SOL balance
            const solBalance = await connection.getBalance(publicKey);
            setBalance(solBalance / LAMPORTS_PER_SOL);

            // Fetch specific token balance
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
            } else {
                setTokenBalance(null);
            }
        } catch (error) {
            console.error('Error fetching balances:', error);
        }
    };

    useEffect(() => {
        if (wallet.connected && publicKey) {
            fetchBalances();
        } else {
            setBalance(0);
            setTokenBalance(null);
        }
    }, [wallet.connected, publicKey]);

    const burnToken = async () => {
        if (!tokenBalance || !burnAmount) return;
        
        setLoading(true);
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
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

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

            alert('Token burn successful!');
            await fetchBalances();
            setBurnAmount('');
        } catch (error) {
            console.error('Error burning token:', error);
            alert(`Error burning token: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Token Burner</h1>
                    <WalletMultiButton />
                </div>

                {!wallet.connected ? (
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Welcome!</h2>
                        <p className="text-gray-600 mb-4">Please connect your wallet to continue</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Wallet Information</h2>
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600">Address:</p>
                                <p className="font-mono text-gray-800 break-all">{publicKey.toString()}</p>
                                <p className="text-sm text-gray-600 mt-4">SOL Balance:</p>
                                <p className="font-semibold text-gray-800">{balance.toFixed(4)} SOL</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Token Information</h2>
                            {tokenBalance ? (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Token Balance:</p>
                                        <p className="font-semibold text-gray-800">{tokenBalance.amount}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Amount to Burn
                                        </label>
                                        <input
                                            type="number"
                                            value={burnAmount}
                                            onChange={(e) => setBurnAmount(e.target.value)}
                                            className="w-full p-3 border rounded-lg"
                                            min="0"
                                            max={tokenBalance.amount}
                                            step="any"
                                            placeholder="Enter amount to burn"
                                        />
                                    </div>
                                    <button
                                        onClick={burnToken}
                                        disabled={!burnAmount || loading}
                                        className="w-full p-3 bg-red-600 text-white rounded-lg disabled:bg-gray-300"
                                    >
                                        {loading ? 'Processing...' : 'Burn Tokens'}
                                    </button>
                                </div>
                            ) : (
                                <p className="text-gray-600">No specific token found in wallet</p>
                            )}
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <p className="text-gray-800 font-medium">Processing Transaction...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}