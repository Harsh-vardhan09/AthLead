import mongoose from "mongoose";

const ScoreSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    score: { type: Number, required: true },
    sport: { type: String },
    inputSnapshot: { type: mongoose.Schema.Types.Mixed },
    modelVersion: { type: String },
  },
  {
    timestamps: true,
  },
);

// TTL: auto-delete scores 30 days after creation (replaces former `date` expires field)
ScoreSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
ScoreSchema.index({ score: -1, _id: 1 });

const Score = mongoose.model("Score", ScoreSchema);

export default Score;
