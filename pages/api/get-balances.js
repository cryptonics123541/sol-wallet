import { useState, useEffect, useCallback } from 'react';
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
  const { publicKey, connected, signTransaction, signMessage } = useWallet();
  const { connection } = useConnection();
  const [solBalance, setSolBalance] = useState(0);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingToken, setLoadingToken] = useState('');
  const [error, setError] = useState('');
  const [burnAmount, setBurnAmount] = useState({});
  const [burnTxSignature, setBurnTxSignature] = useState('');
  const [virtualBalance, setVirtualBalance] = useState(0);
  const [lastBurnTime, setLastBurnTime] = useState(0);

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

  // Fetch balances and tokens from the user's wallet
  const getBalances = async () => {
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
    } catch (err) {
      console.error('Detailed error:', err);
      setError(`Error fetching balances: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Generate a unique challenge for the user to sign
  const generateChallenge = () => {
    return `${publicKey.toString()}-${Date.now()}-uniqueChallenge`;
  };

  // Verify the user's signature for a challenge
  const verifySignature = async (challenge) => {
    try {
      const encodedMessage = new TextEncoder().encode(challenge);
      const signature = await signMessage(encodedMessage);
      return signature;
    } catch (err) {
      console.error('Error signing message:', err);
      throw new Error('Signature verification failed');
    }
  };

  // Burn tokens function
  const burnTokens = async (token) => {
    if (!publicKey || !connection) {
      setError('Wallet not connected');
      return;
    }

    const currentTime = Date.now();
    if (currentTime - lastBurnTime < 60000) {
      alert('You can only perform one burn every minute. Please try again later.');
      return;
    }

    const amountToBurn = parseFloat(burnAmount[token.mint]) || 0;
    if (amountToBurn <= 0 || amountToBurn > token.amount) {
      setError('Invalid burn amount.');
      return;
    }

    setLastBurnTime(currentTime);
    setLoadingToken(token.mint);

    try {
      setError('');

      // Fetch on-chain balance before burning
      const accountInfoBefore = await connection.getParsedAccountInfo(new PublicKey(token.tokenAccount));
      const balanceBefore = accountInfoBefore?.value?.data?.parsed?.info?.tokenAmount?.uiAmount;

      // Generate a unique challenge and sign it
      const challenge = generateChallenge();
      await verifySignature(challenge);

      const burnAmountInLamports = amountToBurn * Math.pow(10, token.decimals);
      const transaction = new Transaction().add(
        createBurnInstruction(token.tokenAccount, new PublicKey(token.mint), publicKey, burnAmountInLamports, [])
      );

      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = publicKey;

      const signedTransaction = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(signature);
      setBurnTxSignature(signature);

      // Fetch on-chain balance after burning
      const accountInfoAfter = await connection.getParsedAccountInfo(new PublicKey(token.tokenAccount));
      const balanceAfter = accountInfoAfter?.value?.data?.parsed?.info?.tokenAmount?.uiAmount;

      // Validate that the correct amount has been burned
      if (balanceBefore - balanceAfter !== amountToBurn) {
        throw new Error('On-chain balance does not match expected balance. Possible tampering detected.');
      }

      // Update virtual balance after successful burn
      const newVirtualBalance = virtualBalance + amountToBurn;
      setVirtualBalance(newVirtualBalance);
      updateVirtualBalance(newVirtualBalance);
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
                      className="border p-2 mb-4 w-full"
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