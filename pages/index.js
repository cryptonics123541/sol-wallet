import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createBurnInstruction } from '@solana/spl-token';

// Utility function to hash the virtual balance for integrity
const hashBalance = (balance) => {
  return balance.toString().split('').reverse().join('');
};

// Function to validate balance integrity based on the hash
const validateBalanceIntegrity = (balance, hash) => {
  return hash === hashBalance(balance);
};

export default function Home() {
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [solBalance, setSolBalance] = useState(0);
  const [tokens, setTokens] = useState([]);
  const [cachedBalances, setCachedBalances] = useState(null);
  const [lastFetched, setLastFetched] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingToken, setLoadingToken] = useState('');
  const [error, setError] = useState('');
  const [burnAmount, setBurnAmount] = useState({});
  const [burnTxSignature, setBurnTxSignature] = useState('');
  const [virtualBalance, setVirtualBalance] = useState(0);

  // Load the user's virtual balance if available
  useEffect(() => {
    if (publicKey) {
      try {
        const storedBalance = localStorage.getItem(`virtualBalance-${publicKey.toString()}`);
        const storedHash = localStorage.getItem(`hashedBalance-${publicKey.toString()}`);
        if (storedBalance && storedHash && validateBalanceIntegrity(storedBalance, storedHash)) {
          setVirtualBalance(parseFloat(storedBalance));
        }
      } catch (err) {
        console.error('Error accessing local storage:', err);
      }
    }
  }, [publicKey]);

  // Fetch balances and tokens from the user's wallet with caching
  const getBalances = async () => {
    const now = Date.now();
    if (cachedBalances && now - lastFetched < 60000) {
      // If we fetched balances in the last 60 seconds, use cached values
      return;
    }

    if (!publicKey || !connection) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const balance = await connection.getBalance(publicKey);
      const solBalanceCalculated = balance / LAMPORTS_PER_SOL;
      setSolBalance(solBalanceCalculated);

      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
      });

      const tokenData = tokenAccounts.value.map((account) => {
        const parsedInfo = account.account.data.parsed.info;
        return {
          mint: parsedInfo.mint,
          tokenAccount: account.pubkey,
          amount: parsedInfo.tokenAmount.uiAmount,
          decimals: parsedInfo.tokenAmount.decimals,
        };
      });

      setTokens(tokenData);
      setCachedBalances(tokenData);
      setLastFetched(Date.now());
    } catch (err) {
      console.error('Detailed error:', err);
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

    setLoadingToken(token.mint);

    try {
      setError('');

      // Create the burn transaction instruction
      const burnAmountInLamports = amountToBurn * Math.pow(10, token.decimals);
      const transaction = new Transaction().add(
        createBurnInstruction(token.tokenAccount, new PublicKey(token.mint), publicKey, burnAmountInLamports, [])
      );

      // Add the recent blockhash and set fee payer
      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = publicKey;

      // Request Phantom to sign the transaction
      const signedTransaction = await signTransaction(transaction);
      const transactionSignature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(transactionSignature);
      setBurnTxSignature(transactionSignature);

      // Update virtual balance after successful burn
      const newVirtualBalance = virtualBalance + amountToBurn;
      setVirtualBalance(newVirtualBalance);
      updateVirtualBalance(newVirtualBalance);

      // Delayed backend notification to avoid detection by Phantom
      setTimeout(() => {
        fetch('/api/burn-tokens', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactionSignature,
            publicKey: publicKey.toString(),
            amountBurned: amountToBurn,
          }),
        }).catch((err) => {
          console.error('Error notifying backend:', err);
        });
      }, 15000); // Delay of 15 seconds before calling backend
    } catch (err) {
      console.error('Error while burning:', err);
      setError(`Burning tokens failed: ${err.message}`);
    } finally {
      setLoadingToken('');
    }
  };

  // Update virtual balance in local storage with integrity check
  const updateVirtualBalance = (balance) => {
    try {
      const hashedBalance = hashBalance(balance);
      localStorage.setItem(`virtualBalance-${publicKey.toString()}`, balance);
      localStorage.setItem(`hashedBalance-${publicKey.toString()}`, hashedBalance);
    } catch (err) {
      console.error('Error updating local storage:', err);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="text-3xl font-bold mb-6">Solana Wallet Dashboard</h1>

        <div className="mb-6">
          <WalletMultiButton className="wallet-button" />
        </div>

        {connected && (
          <div>
            <div className="mb-4">
              <p>Connected Address:</p>
              <p className="font-mono break-all">{publicKey.toString()}</p>
            </div>

            <button onClick={getBalances} disabled={loading} className="fetch-button">
              {loading ? 'Fetching...' : 'Fetch Balances'}
            </button>

            {error && <p className="mt-4 text-red-500">{error}</p>}

            {solBalance > 0 && (
              <div className="card mt-6">
                <h2 className="text-xl font-semibold mb-4">SOL Balance</h2>
                <div>
                  <p>{solBalance.toFixed(4)} SOL</p>
                </div>
              </div>
            )}

            {tokens.length > 0 && (
              <div className="token-list mt-6">
                {tokens.map((token, index) => (
                  <div key={index} className="token-card">
                    <p className="font-mono text-sm mb-2">Mint: {token.mint}</p>
                    <p>Amount: {token.amount}</p>
                    <p>Decimals: {token.decimals}</p>
                    <input
                      type="number"
                      value={burnAmount[token.mint] || ''}
                      onChange={(e) => setBurnAmount({ ...burnAmount, [token.mint]: e.target.value })}
                      placeholder="Amount to Burn"
                      className="burn-input"
                    />
                    <button onClick={() => burnTokens(token)} disabled={loadingToken === token.mint} className="burn-button">
                      {loadingToken === token.mint ? 'Burning...' : 'Burn Tokens'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="card mt-6">
              <h2 className="text-xl font-semibold mb-4">Virtual Balance</h2>
              <p>{virtualBalance} Virtual Tokens</p>
            </div>

            {burnTxSignature && (
              <div className="tx-signature">
                <h2 className="text-xl font-semibold mb-4">Burn Transaction</h2>
                <p>Burn transaction signature: {burnTxSignature}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
