import connectDB from '../../utils/db';
import User from '../../models/User';

let requestCounts = {};
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 10; // Limit each IP to 10 requests per window

// Simple rate limiter for Next.js API route
const rateLimiter = (req) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  if (!requestCounts[ip]) {
    requestCounts[ip] = { count: 1, timestamp: Date.now() };
  } else {
    if (Date.now() - requestCounts[ip].timestamp < RATE_LIMIT_WINDOW) {
      if (requestCounts[ip].count >= RATE_LIMIT_MAX) {
        return false; // Rate limit exceeded
      }
      requestCounts[ip].count += 1;
    } else {
      // Reset rate limit window
      requestCounts[ip] = { count: 1, timestamp: Date.now() };
    }
  }

  return true;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting logic
  if (!rateLimiter(req)) {
    return res.status(429).json({ error: 'Too many requests, please try again later.' });
  }

  const { transactionSignature, publicKey, amountBurned } = req.body;

  if (!transactionSignature || !publicKey || !amountBurned) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

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
