import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export default function Home() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [tokens, setTokens] = useState([]);

  const getTokenAccounts = async () => {
    if (!publicKey) return;

    try {
      const response = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
      });

      const tokenDetails = response.value.map((accountInfo) => {
        const parsedInfo = accountInfo.account.data.parsed.info;
        return {
          mint: parsedInfo.mint,
          amount: parsedInfo.tokenAmount.uiAmount,
          decimals: parsedInfo.tokenAmount.decimals,
        };
      });

      setTokens(tokenDetails);
    } catch (error) {
      console.error('Error fetching token accounts:', error);
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
                onClick={getTokenAccounts}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Fetch Token Holdings
              </button>

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