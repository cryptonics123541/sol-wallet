import { Connection, PublicKey } from '@solana/web3.js';
import connectDB from '../../utils/db';
import User from '../../models/User';

const SOLANA_RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { transactionSignature, publicKey, amountBurned } = req.body;

  try {
    // Artificial delay to mimic local response time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Connect to MongoDB
    await connectDB();

    // Step 1: Verify if the transaction has already been processed
    let user = await User.findOne({ walletAddress: publicKey });
    if (user && user.transactionIds.includes(transactionSignature)) {
      return res.status(400).json({ error: 'Transaction already processed.' });
    }

    // Step 2: Verify the transaction on the Solana blockchain
    const tx = await connection.getTransaction(transactionSignature, {
      commitment: 'confirmed',
    });
    if (!tx) {
      return res.status(400).json({ error: 'Invalid transaction signature.' });
    }

    // Step 3: Update user's virtual balance atomically
    user = await User.findOneAndUpdate(
      { walletAddress: publicKey },
      {
        $inc: { virtualBalance: amountBurned },
        $addToSet: { transactionIds: transactionSignature },
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({ virtualBalance: user.virtualBalance });
  } catch (err) {
    console.error('Error verifying burn transaction:', err);
    return res.status(500).json({ error: 'Internal Server Error during transaction processing.' });
  }
}
