import { useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

export default function Home() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [tokens, setTokens] = useState([]);
  const [solBalance, setSolBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getBalances = useCallback(async () => {
    if (!publicKey || !connection) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get SOL balance using getAccountInfo instead of getBalance
      const accountInfo = await connection.getAccountInfo(publicKey);
      const balance = accountInfo ? accountInfo.lamports / LAMPORTS_PER_SOL : 0;
      setSolBalance(balance);

      // Get token accounts using getParsedProgramAccounts
      const tokenAccounts = await connection.getParsedProgramAccounts(
        new PublicKey(TOKEN_PROGRAM_ID),
        {
          filters: [
            {
              dataSize: 165, // size of token account
            },
            {
              memcmp: {
                offset: 32, // location of owner address
                bytes: publicKey.toBase58(),
              },
            },
          ],
        }
      );

      const tokenDetails = tokenAccounts
        .map((account) => {
          const parsedData = account.account.data.parsed;
          const info = parsedData?.info;
          if (!info || !info.tokenAmount) return null;

          return {
            mint: info.mint,
            amount: info.tokenAmount.uiAmount,
            decimals: info.tokenAmount.decimals,
          };
        })
        .filter(token => token && token.amount > 0);

      setTokens(tokenDetails);

      if (tokenDetails.length === 0 && balance === 0) {
        setError('No SOL or tokens found in this wallet');
      }
    } catch (err) {
      console.error('Error fetching balances:', err);
      setError(`Error fetching balances: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection]);

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