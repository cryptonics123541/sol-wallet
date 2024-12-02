import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import dynamic from 'next/dynamic';

// Dynamically import WalletMultiButton with ssr disabled
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

export default function Home() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [solBalance, setSolBalance] = useState(0);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      const solBalanceCalculated = balance / LAMPORTS_PER_SOL;
      setSolBalance(solBalanceCalculated);

      // Get SPL token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        {
          programId: TOKEN_PROGRAM_ID,
        }
      );

      console.log('Token accounts:', tokenAccounts);

      // Filter and format token data
      const tokenData = tokenAccounts.value
        .filter(account => {
          const amount = account.account.data.parsed.info.tokenAmount;
          return amount.uiAmount > 0;
        })
        .map(account => {
          const parsedInfo = account.account.data.parsed.info;
          return {
            mint: parsedInfo.mint,
            amount: parsedInfo.tokenAmount.uiAmount,
            decimals: parsedInfo.tokenAmount.decimals,
          };
        });

      setTokens(tokenData);
      
      if (balance === 0 && tokenData.length === 0) {
        setError('No SOL or tokens found in this wallet');
      }

    } catch (err) {
      console.error('Detailed error:', err);
      setError(`Error fetching balances: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold mb-6">Solana Wallet Dashboard</h1>
          
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
                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-4">SOL Balance</h2>
                  <div className="border p-4 rounded">
                    <p>{solBalance.toFixed(4)} SOL</p>
                  </div>
                </div>
              )}

              {tokens.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-4">Token Holdings</h2>
                  <div className="space-y-4">
                    {tokens.map((token, index) => (
                      <div key={index} className="border p-4 rounded">
                        <p className="font-mono text-sm mb-2">Mint: {token.mint}</p>
                        <p>Amount: {token.amount}</p>
                        <p>Decimals: {token.decimals}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}