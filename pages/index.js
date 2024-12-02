import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export default function Home() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [solBalance, setSolBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getBalance = async () => {
    if (!publicKey) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('Fetching balance for address:', publicKey.toString());
      
      // Simple SOL balance check
      const balance = await connection.getBalance(publicKey, 'confirmed');
      console.log('Raw balance:', balance);
      
      const solBalanceCalculated = balance / LAMPORTS_PER_SOL;
      console.log('SOL balance:', solBalanceCalculated);
      
      setSolBalance(solBalanceCalculated);
      
      if (balance === 0) {
        setError('No SOL found in this wallet');
      }
    } catch (err) {
      console.error('Error details:', err);
      setError(`Error fetching balance: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

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
                onClick={getBalance}
                disabled={loading}
                className={`${
                  loading 
                    ? 'bg-gray-400' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white px-4 py-2 rounded`}
              >
                {loading ? 'Fetching...' : 'Fetch SOL Balance'}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}