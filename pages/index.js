// pages/index.js
import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createBurnInstruction, createTransferInstruction, getAssociatedTokenAddress, getAccount, createAssociatedTokenAccountInstruction } from '@solana/spl-token';

export default function Home() {
    const { connection } = useConnection();
    const { publicKey, connected, signTransaction } = useWallet();
    const [balance, setBalance] = useState(0);
    const [tokens, setTokens] = useState([]);
    const [selectedToken, setSelectedToken] = useState(null);
    const [burnAmount, setBurnAmount] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [recipientAddress, setRecipientAddress] = useState('');
    const [loading, setLoading] = useState(false);

    // ... keep your existing fetchBalanceAndTokens and burnToken functions ...

    const transferToken = async () => {
        if (!selectedToken || !transferAmount || !recipientAddress) return;
        
        setLoading(true);
        let signature = '';
        
        try {
            // Input validation
            if (isNaN(transferAmount) || parseFloat(transferAmount) <= 0) {
                throw new Error('Invalid transfer amount');
            }

            let recipientPublicKey;
            try {
                recipientPublicKey = new PublicKey(recipientAddress);
            } catch {
                throw new Error('Invalid recipient address');
            }

            const selectedTokenData = tokens.find(t => t.mint === selectedToken);
            if (!selectedTokenData) throw new Error('Token not found');
            if (selectedTokenData.amount < parseFloat(transferAmount)) {
                throw new Error('Insufficient token balance');
            }

            const mintPublicKey = new PublicKey(selectedToken);

            // Get source token account
            const sourceTokenAccount = await getAssociatedTokenAddress(
                mintPublicKey,
                publicKey
            );

            // Get destination token account
            const destinationTokenAccount = await getAssociatedTokenAddress(
                mintPublicKey,
                recipientPublicKey
            );

            const transaction = new Transaction();

            // Check if destination token account exists
            try {
                await getAccount(connection, destinationTokenAccount);
            } catch (error) {
                // If account doesn't exist, add instruction to create it
                transaction.add(
                    createAssociatedTokenAccountInstruction(
                        publicKey,
                        destinationTokenAccount,
                        recipientPublicKey,
                        mintPublicKey
                    )
                );
            }

            // Add transfer instruction
            const transferInstruction = createTransferInstruction(
                sourceTokenAccount,
                destinationTokenAccount,
                publicKey,
                Math.floor(parseFloat(transferAmount) * Math.pow(10, selectedTokenData.decimals))
            );

            transaction.add(transferInstruction);

            // Get latest blockhash
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            // Sign and send transaction
            const signedTransaction = await signTransaction(transaction);
            signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
                skipPreflight: false,
                preflightCommitment: 'finalized',
            });

            // Wait for confirmation
            const confirmation = await connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight
            }, 'finalized');

            if (confirmation.value.err) {
                throw new Error('Transaction failed');
            }

            alert(`Transfer successful! Signature: ${signature}`);
            await fetchBalanceAndTokens();
            setTransferAmount('');
            setRecipientAddress('');
            setSelectedToken(null);
        } catch (error) {
            console.error('Transfer error:', error);
            alert(`Transfer failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">Solana Token Operations</h1>
            
            <div className="mb-8">
                <WalletMultiButton />
            </div>

            {connected && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-2xl font-semibold mb-4">Wallet Info</h2>
                        <p className="mb-2">Address: {publicKey.toString()}</p>
                        <p>SOL Balance: {balance.toFixed(4)} SOL</p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-2xl font-semibold mb-4">Token Operations</h2>
                        <div className="space-y-6">
                            {/* Token Selection */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Select Token</label>
                                <select 
                                    onChange={(e) => setSelectedToken(e.target.value)}
                                    className="w-full p-2 border rounded"
                                    value={selectedToken || ""}
                                >
                                    <option value="">Select a token</option>
                                    {tokens.map((token, index) => (
                                        <option key={index} value={token.mint}>
                                            {token.mint.slice(0, 8)}... ({token.amount})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedToken && (
                                <>
                                    {/* Transfer Section */}
                                    <div className="border-t pt-4">
                                        <h3 className="text-lg font-semibold mb-4">Transfer Token</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Recipient Address</label>
                                                <input
                                                    type="text"
                                                    placeholder="Recipient's Solana address"
                                                    value={recipientAddress}
                                                    onChange={(e) => setRecipientAddress(e.target.value)}
                                                    className="w-full p-2 border rounded"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Transfer Amount</label>
                                                <input
                                                    type="number"
                                                    placeholder="Amount to transfer"
                                                    value={transferAmount}
                                                    onChange={(e) => setTransferAmount(e.target.value)}
                                                    className="w-full p-2 border rounded"
                                                    min="0"
                                                    step="any"
                                                />
                                            </div>
                                            <button 
                                                onClick={transferToken}
                                                disabled={!transferAmount || !recipientAddress || loading}
                                                className="w-full px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
                                            >
                                                {loading ? 'Processing...' : 'Transfer Token'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Burn Section */}
                                    <div className="border-t pt-4">
                                        <h3 className="text-lg font-semibold mb-4">Burn Token</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Burn Amount</label>
                                                <input
                                                    type="number"
                                                    placeholder="Amount to burn"
                                                    value={burnAmount}
                                                    onChange={(e) => setBurnAmount(e.target.value)}
                                                    className="w-full p-2 border rounded"
                                                    min="0"
                                                    step="any"
                                                />
                                            </div>
                                            <button 
                                                onClick={burnToken}
                                                disabled={!burnAmount || loading}
                                                className="w-full px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
                                            >
                                                {loading ? 'Processing...' : 'Burn Token'}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-xl font-semibold mb-4">Your Tokens:</h3>
                        <div className="space-y-4">
                            {tokens.map((token, index) => (
                                <div key={index} className="p-4 border rounded">
                                    <p className="mb-2 break-all">Mint: {token.mint}</p>
                                    <p>Amount: {token.amount}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {loading && (
                <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-4 rounded-lg">
                        <p>Processing transaction...</p>
                    </div>
                </div>
            )}
        </div>
    );
}