import express from 'express';
import rateLimit from 'express-rate-limit';
import connectDB from '../../utils/db';
import User from '../../models/User';

const app = express();
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
});

app.use('/api/burn-tokens', limiter);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { transactionSignature, publicKey, amountBurned } = req.body;

  try {
    // Connect to MongoDB
    await connectDB();

    // Find or create the user in the database
    let user = await User.findOne({ walletAddress: publicKey });
    if (!user) {
      user = new User({ walletAddress: publicKey, virtualBalance: 0, transactionIds: [] });
    }

    // Verify transaction not already processed
    if (user.transactionIds.includes(transactionSignature)) {
      return res.status(400).json({ error: 'Transaction already processed.' });
    }

    // Update user's virtual balance and add transaction ID
    user.virtualBalance += amountBurned;
    user.transactionIds.push(transactionSignature);
    await user.save();

    return res.status(200).json({ virtualBalance: user.virtualBalance });
  } catch (err) {
    console.error('Error verifying burn transaction:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
