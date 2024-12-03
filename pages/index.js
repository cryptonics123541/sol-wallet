import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createBurnInstruction } from '@solana/spl-token';
import dynamic from 'next/dynamic';

// Constants
const PEY_TOKEN_MINT = 'pEy3bG8hrnmbYsWu3VEaYUFmskacT9v7dWTuJKypump';
const CREDITS_PER_TOKEN = 1000; // 1000 tokens = 1 credit

export default function Home() {
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [solBalance, setSolBalance] = useState(0);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingToken, setLoadingToken] = useState('');
  const [error, setError] = useState('');
  const [burnAmount, setBurnAmount] = useState({});
  const [burnTxSignature, setBurnTxSignature] = useState('');
  const [credits, setCredits] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Handle mounting for SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load user's saved credits
  useEffect(() => {
    if (publicKey) {
      const savedCredits = localStorage.getItem(`credits-${publicKey.toString()}`);
      if (savedCredits) {
        setCredits(parseInt(savedCredits));
      }
    }
  }, [publicKey]);

  // Fetch balances
  const getBalances = async () => {
    if (!publicKey || !connection) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Get SOL balance
      const balance = await connection.getBalance(publicKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);

      // Get token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        {
          programId: TOKEN_PROGRAM_ID,
        }
      );

      // Process token data
      const tokenData = tokenAccounts.value
        .map((account) => {
          const parsedInfo = account.account.data.parsed.info;
          return {
            mint: parsedInfo.mint,
            tokenAccount: account.pubkey,
            amount: parsedInfo.tokenAmount.uiAmount,
            decimals: parsedInfo.tokenAmount.decimals,
          };
        })
        .filter(token => token.amount > 0); // Only show tokens with balance

      setTokens(tokenData);
    } catch (err) {
      console.error('Error fetching balances:', err);
      setError(`Error fetching balances: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Burn tokens function
  const burnTokens = async (token) => {
    if (!publicKey || !connection) {
      setError('Wallet not connected');
      return;
    }

    const amountToBurn = parseFloat(burnAmount[token.mint]) || 0;
    if (amountToBurn <= 0 || amountToBurn > token.amount) {
      setError('Invalid burn amount.');
      return;
    }

    // Only allow burning of PEY tokens
    if (token.mint !== PEY_TOKEN_MINT) {
      setError('Invalid token - can only burn PEY tokens');
      return;
    }

    setLoadingToken(token.mint);

    try {
      setError('');

      // Create burn instruction
      const burnAmountInLamports = amountToBurn * Math.pow(10, token.decimals);
      const transaction = new Transaction().add(
        createBurnInstruction(
          new PublicKey(token.tokenAccount),
          new PublicKey(token.mint),
          publicKey,
          burnAmountInLamports
        )
      );

      // Get latest blockhash
      const latestBlockhash = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = publicKey;

      // Sign and send transaction
      const signedTransaction = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }

      setBurnTxSignature(signature);

      // Calculate and update credits (1000 tokens = 1 credit)
      const newCredits = credits + Math.floor(amountToBurn / CREDITS_PER_TOKEN);
      setCredits(newCredits);
      localStorage.setItem(`credits-${publicKey.toString()}`, newCredits.toString());

      // Record burn transaction
      await fetch('/api/burn-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionSignature: signature,
          publicKey: publicKey.toString(),
          amountBurned: amountToBurn,
        }),
      });

      // Clear burn amount and refresh balances
      setBurnAmount({ ...burnAmount, [token.mint]: '' });
      await getBalances();

    } catch (err) {
      console.error('Error while burning:', err);
      setError(`Burning tokens failed: ${err.message}`);
    } finally {
      setLoadingToken('');
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold mb-6">PEY Token Burning Dashboard</h1>
          
          <div className="mb-6">
            <WalletMultiButton />
          </div>

          {connected && (
            <div>
              <div className="mb-4">
                <p className="text-gray-600">Connected Address:</p>
                <p className="font-mono break-all">{publicKey.toString()}</p>
              </div>

              <button 
                onClick={getBalances}
                disabled={loading}
                className={`${
                  loading 
                    ? 'bg-gray-400' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white px-4 py-2 rounded`}
              >
                {loading ? 'Fetching...' : 'Fetch Balances'}
              </button>

              {error && (
                <p className="mt-4 text-red-500">{error}</p>
              )}

              {solBalance > 0 && (
                <div className="mt-6 p-4 border rounded-lg">
                  <h2 className="text-xl font-semibold mb-4">SOL Balance</h2>
                  <p>{solBalance.toFixed(4)} SOL</p>
                </div>
              )}

              {tokens.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-4">Token Holdings</h2>
                  <div className="space-y-4">
                    {tokens.map((token, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <p className="font-mono text-sm mb-2">Mint: {token.mint}</p>
                        <p>Amount: {token.amount}</p>
                        <p>Decimals: {token.decimals}</p>
                        {token.mint === PEY_TOKEN_MINT && (
                          <div className="mt-4">
                            <input
                              type="number"
                              value={burnAmount[token.mint] || ''}
                              onChange={(e) => setBurnAmount({ ...burnAmount, [token.mint]: e.target.value })}
                              placeholder="Amount to burn"
                              className="w-full p-2 border rounded mb-2"
                              min="0"
                              max={token.amount}
                            />
                            <button
                              onClick={() => burnTokens(token)}
                              disabled={loadingToken === token.mint}
                              className={`${
                                loadingToken === token.mint
                                  ? 'bg-gray-400'
                                  : 'bg-red-500 hover:bg-red-600'
                              } text-white px-4 py-2 rounded w-full`}
                            >
                              {loadingToken === token.mint ? 'Burning...' : 'Burn Tokens'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 border rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Credits Available</h2>
                <p>{credits} Credits</p>
                <p className="text-sm text-gray-500 mt-2">
                  (1 credit per {CREDITS_PER_TOKEN} PEY tokens burned)
                </p>
              </div>

              {burnTxSignature && (
                <div className="mt-6 p-4 border rounded-lg">
                  <h2 className="text-xl font-semibold mb-4">Last Burn Transaction</h2>
                  <p className="font-mono text-sm break-all">{burnTxSignature}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}