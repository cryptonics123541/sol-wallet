import { Connection, PublicKey } from '@solana/web3.js';

// Rate limiting setup
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 requests per minute
const rateLimit = new Map();

// Constants
const PEY_TOKEN_MINT = 'pEy3bG8hrnmbYsWu3VEaYUFmskacT9v7dWTuJKypump';
const CREDITS_PER_TOKEN = 1000; // 1000 tokens = 1 credit

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  // Clean up old rate limit entries
  for (const [key, timestamp] of rateLimit.entries()) {
    if (timestamp < windowStart) {
      rateLimit.delete(key);
    }
  }

  // Check rate limit
  const userRequests = Array.from(rateLimit.entries())
    .filter(([key, timestamp]) => key.startsWith(ip) && timestamp > windowStart)
    .length;

  if (userRequests >= RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  // Add this request to rate limit tracking
  rateLimit.set(`${ip}-${now}`, now);

  const { transactionSignature, publicKey, amountBurned } = req.body;

  if (!transactionSignature || !publicKey || !amountBurned) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Connect to Solana
    const connection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "https://mainnet.helius-rpc.com/?api-key=4a0035ea-34b5-4afc-87a5-fbcca3474880");

    // Verify the transaction
    const transaction = await connection.getTransaction(transactionSignature, {
      maxSupportedTransactionVersion: 0
    });

    if (!transaction) {
      return res.status(400).json({ error: 'Transaction not found' });
    }

    // Verify transaction was successful
    if (transaction.meta.err) {
      return res.status(400).json({ error: 'Transaction failed' });
    }

    // Verify this was a burn transaction
    const programIds = transaction.transaction.message.programIds().map(id => id.toString());
    if (!programIds.includes(TOKEN_PROGRAM_ID)) {
      return res.status(400).json({ error: 'Not a token transaction' });
    }

    // Verify the correct mint
    const accountKeys = transaction.transaction.message.accountKeys.map(key => key.toString());
    if (!accountKeys.includes(PEY_TOKEN_MINT)) {
      return res.status(400).json({ error: 'Invalid token mint' });
    }

    // Calculate credits
    const credits = Math.floor(amountBurned / CREDITS_PER_TOKEN);

    // Here you would typically:
    // 1. Store the transaction in your database
    // 2. Update the user's credit balance
    // 3. Record the burn transaction

    // For now, we'll just return the credits earned
    return res.status(200).json({
      success: true,
      credits,
      transactionSignature,
      message: `Successfully burned ${amountBurned} tokens for ${credits} credits`
    });

  } catch (error) {
    console.error('Error processing burn transaction:', error);
    return res.status(500).json({ error: 'Error processing burn transaction' });
  }
}