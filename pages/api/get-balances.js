import connectDB from '../../utils/db';
import User from '../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { walletAddress } = req.query;

  try {
    // Connect to MongoDB
    await connectDB();

    // Find the user by wallet address
    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({ virtualBalance: 0 });
    }

    return res.status(200).json({ virtualBalance: user.virtualBalance });
  } catch (err) {
    console.error('Error fetching virtual balance:', err);
    res.status(500).json({ error: 'Internal Server Error.' });
  }
}
