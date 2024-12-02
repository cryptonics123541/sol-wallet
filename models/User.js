import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  walletAddress: { type: String, unique: true },
  virtualBalance: { type: Number, default: 0 },
  transactionIds: [String], // Array to track processed transactions and prevent replay attacks
});

// Use an existing model if it exists to avoid recompiling the model
export default mongoose.models.User || mongoose.model('User', UserSchema);
