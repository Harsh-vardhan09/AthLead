import mongoose from "mongoose";
import { float32 } from "zod";

const ScoreSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  date: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 30, // 30 days in seconds
  },
  score: { type: Number, requied: true },
});

const Score = mongoose.model("Score", ScoreSchema);

export default Score;
