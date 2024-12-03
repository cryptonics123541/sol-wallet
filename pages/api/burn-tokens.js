import { Connection, PublicKey } from '@solana/web3.js';
import connectDB from '../../utils/db';
import User from '../../models/User';

const SOLANA_RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { transactionSignature, publicKey, amountBurned, nonce, challenge, signature } = req.body;

    // Validate required fields
    if (!transactionSignature || !publicKey || !amountBurned || !nonce || !challenge || !signature) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    try {
      // Connect to MongoDB
      await connectDB();

      // Step 1: Verify the transaction on Solana blockchain
      const tx = await connection.getTransaction(transactionSignature, {
        commitment: 'confirmed',
      });
      if (!tx) {
        return res.status(400).json({ error: 'Invalid transaction signature.' });
      }

      // Step 2: Check if the transaction has a burn instruction for the correct mint address
      const burnInstruction = tx.transaction.message.instructions.find(
        (ix) =>
          ix.programId.toString() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' &&
          ix.keys.some((key) => key.pubkey.toString() === process.env.EXPECTED_TOKEN_MINT)
      );

      if (!burnInstruction) {
        return res.status(400).json({ error: 'No valid burn instruction found in transaction.' });
      }

      // Step 3: Verify that the wallet matches the signer
      const signerKey = tx.transaction.message.accountKeys[0].toString();
      if (signerKey !== publicKey) {
        return res.status(400).json({ error: 'Transaction signature does not match wallet public key.' });
      }

      // Step 4: Prevent replay attacks
      let user = await User.findOne({ walletAddress: publicKey });
      if (user && user.transactionIds.includes(transactionSignature)) {
        return res.status(400).json({ error: 'Transaction already processed.' });
      }

      // Step 5: Update user's virtual balance atomically
      user = await User.findOneAndUpdate(
        { walletAddress: publicKey },
        {
          $inc: { virtualBalance: amountBurned },
          $addToSet: { transactionIds: transactionSignature },
        },
        { upsert: true, new: true }
      );

      return res.status(200).json({ virtualBalance: user.virtualBalance });
    } catch (innerError) {
      console.error('Error during transaction verification or database update:', innerError);
      return res.status(500).json({ error: 'Internal Server Error during transaction processing.' });
    }
  } catch (outerError) {
    console.error('Unexpected server error:', outerError);
    return res.status(500).json({ error: 'Unexpected server error. Please try again later.' });
  }
}
