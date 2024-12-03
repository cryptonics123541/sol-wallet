// pages/index.js
import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createBurnInstruction, getAssociatedTokenAddress } from '@solana/spl-token';

export default function Home() {
    const { connection } = useConnection();
    const { publicKey, connected, signTransaction } = useWallet();
    const [balance, setBalance] = useState(0);
    const [tokens, setTokens] = useState([]);
    const [selectedToken, setSelectedToken] = useState(null);
    const [burnAmount, setBurnAmount] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (connected && publicKey) {
            fetchBalanceAndTokens();
        }
    }, [connected, publicKey]);

    const fetchBalanceAndTokens = async () => {
        try {
            // Fetch SOL balance
            const balance = await connection.getBalance(publicKey);
            setBalance(balance / LAMPORTS_PER_SOL);

            // Fetch SPL tokens
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
                programId: TOKEN_PROGRAM_ID,
            });

            const tokenList = tokenAccounts.value.map(accountInfo => ({
                mint: accountInfo.account.data.parsed.info.mint,
                amount: accountInfo.account.data.parsed.info.tokenAmount.uiAmount,
                decimals: accountInfo.account.data.parsed.info.tokenAmount.decimals,
                address: accountInfo.pubkey,
            }));

            setTokens(tokenList);
        } catch (error) {
            console.error('Error fetching balance:', error);
        }
    };

    const burnToken = async () => {
        if (!selectedToken || !burnAmount) return;
        
        setLoading(true);
        try {
            const selectedTokenData = tokens.find(t => t.mint === selectedToken);
            if (!selectedTokenData) throw new Error('Token not found');

            const mintPubkey = new PublicKey(selectedToken);
            const tokenAmount = parseFloat(burnAmount);
            const decimals = selectedTokenData.decimals;
            const adjustedAmount = tokenAmount * Math.pow(10, decimals);

            // Get the token account address
            const tokenAccountAddress = await getAssociatedTokenAddress(
                mintPubkey,
                publicKey
            );

            // Create the burn instruction
            const burnInstruction = createBurnInstruction(
                tokenAccountAddress,
                mintPubkey,
                publicKey,
                Math.floor(adjustedAmount)
            );

            // Create and send transaction
            const transaction = new Transaction().add(burnInstruction);
            transaction.feePayer = publicKey;
            transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

            const signedTransaction = await signTransaction(transaction);
            const signature = await connection.sendRawTransaction(signedTransaction.serialize());
            await connection.confirmTransaction(signature);

            alert('Token burn successful!');
            fetchBalanceAndTokens(); // Refresh token list
            setBurnAmount(''); // Reset burn amount
        } catch (error) {
            console.error('Error burning token:', error);
            alert(`Error burning token: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">Solana Wallet Integration</h1>
            
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
                        <h2 className="text-2xl font-semibold mb-4">SPL Tokens</h2>
                        <div className="mb-4 space-y-4">
                            <div className="flex gap-4">
                                <select 
                                    onChange={(e) => setSelectedToken(e.target.value)}
                                    className="p-2 border rounded flex-1"
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
                                <div className="flex gap-4">
                                    <input
                                        type="number"
                                        placeholder="Amount to burn"
                                        value={burnAmount}
                                        onChange={(e) => setBurnAmount(e.target.value)}
                                        className="p-2 border rounded flex-1"
                                        min="0"
                                        step="any"
                                    />
                                    <button 
                                        onClick={burnToken}
                                        disabled={!selectedToken || !burnAmount || loading}
                                        className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
                                    >
                                        {loading ? 'Burning...' : 'Burn Token'}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold">Your Tokens:</h3>
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
        </div>
    );
}