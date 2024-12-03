import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createBurnInstruction } from '@solana/spl-token';
import dynamic from 'next/dynamic';

// Constant for the PEY token mint
const PEY_TOKEN_MINT = new PublicKey('pEy3bG8hrnmbYsWu3VEaYUFmskacT9v7dWTuJKypump');

export default function Home() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [burnAmount, setBurnAmount] = useState('');

  const burnTokens = async (tokenAccount, amount, decimals) => {
    if (!publicKey || !amount) return;

    try {
      setLoading(true);
      
      // Convert amount to proper decimals
      const adjustedAmount = amount * Math.pow(10, decimals);

      // Create the simplest possible burn instruction
      const burnIx = createBurnInstruction(
        new PublicKey(tokenAccount),  // Token account
        PEY_TOKEN_MINT,              // Mint
        publicKey,                   // Owner
        BigInt(adjustedAmount)       // Amount
      );

      // Create and send transaction
      const tx = new Transaction().add(burnIx);
      const signature = await sendTransaction(tx, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature);

      // Refresh token balances
      getTokenBalances();
      
    } catch (error) {
      console.error('Burn failed:', error);
    } finally {
      setLoading(false);
      setBurnAmount('');
    }
  };

  const getTokenBalances = async () => {
    if (!publicKey) return;
    
    try {
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      const peyToken = tokenAccounts.value
        .filter(account => account.account.data.parsed.info.mint === PEY_TOKEN_MINT.toString())
        .map(account => ({
          tokenAccount: account.pubkey,
          mint: account.account.data.parsed.info.mint,
          amount: account.account.data.parsed.info.tokenAmount.uiAmount,
          decimals: account.account.data.parsed.info.tokenAmount.decimals,
        }))[0];

      if (peyToken) {
        setTokens([peyToken]);
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    }
  };

  useEffect(() => {
    if (publicKey) {
      getTokenBalances();
    }
  }, [publicKey, connection]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold mb-6">PEY Token Burner</h1>
          
          <div className="mb-6">
            <WalletMultiButton />
          </div>

          {connected && tokens.map(token => (
            <div key={token.mint} className="p-4 border rounded-lg mt-4">
              <p>Available: {token.amount} PEY</p>
              <div className="mt-4">
                <input
                  type="number"
                  value={burnAmount}
                  onChange={(e) => setBurnAmount(e.target.value)}
                  placeholder="Amount to burn"
                  className="w-full p-2 border rounded mb-2"
                  max={token.amount}
                />
                <button
                  onClick={() => burnTokens(token.tokenAccount, parseFloat(burnAmount), token.decimals)}
                  disabled={loading || !burnAmount}
                  className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
                >
                  {loading ? 'Burning...' : 'Burn Tokens'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}