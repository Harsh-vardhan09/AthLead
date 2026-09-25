import mongoose from "mongoose";

const ScoreSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    score: { type: Number, required: true },
  },
  {
    timestamps: true,
  },
);

// TTL: auto-delete scores 30 days after creation (replaces former `date` expires field)
ScoreSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
// Add an index to score to optimize sorting rankings
ScoreSchema.index({ score: -1 });

const Score = mongoose.model("Score", ScoreSchema);

export default Score;
