import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  walletAddress: { type: String, unique: true, required: true },
  virtualBalance: { type: Number, default: 0, min: 0 },
  transactionIds: {
    type: [String],
    required: true,
    default: [],
  },
}, { timestamps: true }); // Enable timestamps for createdAt and updatedAt

// Use an existing model if it exists to avoid recompiling the model
export default mongoose.models.User || mongoose.model('User', UserSchema);
