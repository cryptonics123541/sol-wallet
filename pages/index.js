// pages/index.js
import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createBurnInstruction, createTransferInstruction, getAssociatedTokenAddress, getAccount, createAssociatedTokenAccountInstruction } from '@solana/spl-token';

// Wallet Info Component
const WalletInfo = ({ publicKey, balance }) => (
    <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Wallet Information</h2>
        <div className="space-y-2">
            <p className="text-sm text-gray-600">Address:</p>
            <p className="font-mono text-gray-800 break-all">{publicKey.toString()}</p>
            <p className="text-sm text-gray-600 mt-4">SOL Balance:</p>
            <p className="font-semibold text-gray-800">{balance.toFixed(4)} SOL</p>
        </div>
    </div>
);

// Token List Component
const TokenList = ({ tokens }) => (
    <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Tokens</h2>
        <div className="space-y-4">
            {tokens.map((token, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Mint Address:</p>
                    <p className="font-mono text-gray-800 break-all mb-2">{token.mint}</p>
                    <p className="text-sm text-gray-600">Balance:</p>
                    <p className="font-semibold text-gray-800">{token.amount}</p>
                </div>
            ))}
            {tokens.length === 0 && (
                <p className="text-gray-600 text-center py-4">No tokens found in wallet</p>
            )}
        </div>
    </div>
);

// Main Component
export default function Home() {
    const { connection } = useConnection();
    const wallet = useWallet();
    const { publicKey, signTransaction } = wallet;
    const [balance, setBalance] = useState(0);
    const [tokens, setTokens] = useState([]);
    const [selectedToken, setSelectedToken] = useState(null);
    const [burnAmount, setBurnAmount] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [recipientAddress, setRecipientAddress] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchBalanceAndTokens = async () => {
        if (!publicKey) return;
        
        try {
            const balance = await connection.getBalance(publicKey);
            setBalance(balance / LAMPORTS_PER_SOL);

            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
                programId: TOKEN_PROGRAM_ID,
            });

            const tokenList = tokenAccounts.value.map(accountInfo => ({
                mint: accountInfo.account.data.parsed.info.mint,
                amount: accountInfo.account.data.parsed.info.tokenAmount.uiAmount,
                decimals: accountInfo.account.data.parsed.info.tokenAmount.decimals,
            }));

            setTokens(tokenList);
        } catch (error) {
            console.error('Error fetching balance:', error);
        }
    };

    useEffect(() => {
        if (wallet.connected && publicKey) {
            fetchBalanceAndTokens();
        }
    }, [wallet.connected, publicKey]);

    const burnToken = async () => {
        if (!selectedToken || !burnAmount) return;
        
        setLoading(true);
        try {
            const selectedTokenData = tokens.find(t => t.mint === selectedToken);
            if (!selectedTokenData) throw new Error('Token not found');

            const mintPubkey = new PublicKey(selectedToken);
            const tokenAccountAddress = await getAssociatedTokenAddress(
                mintPubkey,
                publicKey
            );

            const burnInstruction = createBurnInstruction(
                tokenAccountAddress,
                mintPubkey,
                publicKey,
                Math.floor(parseFloat(burnAmount) * Math.pow(10, selectedTokenData.decimals))
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
            await fetchBalanceAndTokens();
            setBurnAmount('');
            setSelectedToken(null);
        } catch (error) {
            console.error('Error burning token:', error);
            alert(`Error burning token: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const transferToken = async () => {
        if (!selectedToken || !transferAmount || !recipientAddress) return;
        
        setLoading(true);
        try {
            const selectedTokenData = tokens.find(t => t.mint === selectedToken);
            if (!selectedTokenData) throw new Error('Token not found');

            const recipient = new PublicKey(recipientAddress);
            const mintPubkey = new PublicKey(selectedToken);
            
            const sourceAccount = await getAssociatedTokenAddress(mintPubkey, publicKey);
            const destinationAccount = await getAssociatedTokenAddress(mintPubkey, recipient);

            const transaction = new Transaction();

            try {
                await getAccount(connection, destinationAccount);
            } catch {
                transaction.add(
                    createAssociatedTokenAccountInstruction(
                        publicKey,
                        destinationAccount,
                        recipient,
                        mintPubkey
                    )
                );
            }

            transaction.add(
                createTransferInstruction(
                    sourceAccount,
                    destinationAccount,
                    publicKey,
                    Math.floor(parseFloat(transferAmount) * Math.pow(10, selectedTokenData.decimals))
                )
            );

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

            alert('Transfer successful!');
            await fetchBalanceAndTokens();
            setTransferAmount('');
            setRecipientAddress('');
            setSelectedToken(null);
        } catch (error) {
            console.error('Error transferring token:', error);
            alert(`Error transferring token: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Solana Token Manager</h1>
                    <WalletMultiButton />
                </div>

                {!wallet.connected ? (
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Welcome!</h2>
                        <p className="text-gray-600 mb-4">Please connect your wallet to continue</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <WalletInfo publicKey={publicKey} balance={balance} />

                        <div className="bg-white rounded-lg shadow">
                            <div className="p-6">
                                <select 
                                    onChange={(e) => setSelectedToken(e.target.value)}
                                    value={selectedToken || ""}
                                    className="w-full p-3 border rounded-lg"
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
                                <div className="p-6 border-t space-y-6">
                                    <div>
                                        <h3 className="text-lg font-medium mb-4">Transfer</h3>
                                        <div className="space-y-4">
                                            <input
                                                type="text"
                                                placeholder="Recipient address"
                                                value={recipientAddress}
                                                onChange={(e) => setRecipientAddress(e.target.value)}
                                                className="w-full p-3 border rounded-lg"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Amount to transfer"
                                                value={transferAmount}
                                                onChange={(e) => setTransferAmount(e.target.value)}
                                                className="w-full p-3 border rounded-lg"
                                                min="0"
                                                step="any"
                                            />
                                            <button
                                                onClick={transferToken}
                                                disabled={!transferAmount || !recipientAddress || loading}
                                                className="w-full p-3 bg-blue-600 text-white rounded-lg disabled:bg-gray-300"
                                            >
                                                {loading ? 'Processing...' : 'Transfer'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t">
                                        <h3 className="text-lg font-medium mb-4">Burn</h3>
                                        <div className="space-y-4">
                                            <input
                                                type="number"
                                                placeholder="Amount to burn"
                                                value={burnAmount}
                                                onChange={(e) => setBurnAmount(e.target.value)}
                                                className="w-full p-3 border rounded-lg"
                                                min="0"
                                                step="any"
                                            />
                                            <button
                                                onClick={burnToken}
                                                disabled={!burnAmount || loading}
                                                className="w-full p-3 bg-red-600 text-white rounded-lg disabled:bg-gray-300"
                                            >
                                                {loading ? 'Processing...' : 'Burn'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <TokenList tokens={tokens} />
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