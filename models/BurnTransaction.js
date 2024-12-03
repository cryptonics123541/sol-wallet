import mongoose from 'mongoose';

const BurnTransactionSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    index: true
  },
  transactionSignature: {
    type: String,
    required: true,
    unique: true
  },
  amountBurned: {
    type: Number,
    required: true
  },
  creditsEarned: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  verified: {
    type: Boolean,
    default: false
  }
});

export default mongoose.models.BurnTransaction || mongoose.model('BurnTransaction', BurnTransactionSchema);