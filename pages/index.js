// pages/index.js
import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export default function Home() {
    const { connection } = useConnection();
    const { publicKey, connected } = useWallet();
    const [balance, setBalance] = useState(0);
    const [tokens, setTokens] = useState([]);
    const [selectedToken, setSelectedToken] = useState(null);

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
            }));

            setTokens(tokenList);
        } catch (error) {
            console.error('Error fetching balance:', error);
        }
    };

    const burnToken = async (tokenMint) => {
        if (!selectedToken) return;
        try {
            // Implement burn functionality here
            console.log('Burning token:', tokenMint);
            alert('Burn functionality will be implemented in the next step');
        } catch (error) {
            console.error('Error burning token:', error);
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
                        <div className="mb-4 flex gap-4">
                            <select 
                                onChange={(e) => setSelectedToken(e.target.value)}
                                className="p-2 border rounded flex-1"
                            >
                                <option value="">Select a token</option>
                                {tokens.map((token, index) => (
                                    <option key={index} value={token.mint}>
                                        {token.mint.slice(0, 8)}... ({token.amount})
                                    </option>
                                ))}
                            </select>
                            <button 
                                onClick={() => burnToken(selectedToken)}
                                disabled={!selectedToken}
                                className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
                            >
                                Burn Token
                            </button>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold">Your Tokens:</h3>
                            {tokens.map((token, index) => (
                                <div key={index} className="p-4 border rounded">
                                    <p className="mb-2">Mint: {token.mint}</p>
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