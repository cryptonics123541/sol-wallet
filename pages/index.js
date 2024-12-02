import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export default function Home() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [tokens, setTokens] = useState([]);
  const [solBalance, setSolBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getBalances = async () => {
    if (!publicKey) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Debug log
      console.log('Fetching balances for address:', publicKey.toString());
      console.log('Connection endpoint:', connection.rpcEndpoint);

      // Get SOL balance
      const balance = await connection.getBalance(publicKey);
      console.log('Raw SOL balance (lamports):', balance);
      const solBalanceCalculated = balance / LAMPORTS_PER_SOL;
      console.log('Converted SOL balance:', solBalanceCalculated);
      setSolBalance(solBalanceCalculated);

      // Get token accounts with more detailed error handling
      console.log('Fetching token accounts...');
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        {
          programId: TOKEN_PROGRAM_ID,
        }
      );

      console.log('Raw token accounts response:', tokenAccounts);

      const tokenDetails = tokenAccounts.value
        .filter(account => {
          const tokenAmount = account.account.data.parsed.info.tokenAmount;
          console.log('Token amount for account:', tokenAmount);
          return tokenAmount.uiAmount > 0;
        })
        .map((account) => {
          const parsedInfo = account.account.data.parsed.info;
          return {
            mint: parsedInfo.mint,
            amount: parsedInfo.tokenAmount.uiAmount,
            decimals: parsedInfo.tokenAmount.decimals,
          };
        });

      console.log('Processed token details:', tokenDetails);
      setTokens(tokenDetails);
      
      if (tokenDetails.length === 0 && balance === 0) {
        setError('No SOL or tokens found in this wallet');
      }
    } catch (error) {
      console.error('Detailed error:', error);
      setError(`Failed to fetch balances: ${error.message}`);
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