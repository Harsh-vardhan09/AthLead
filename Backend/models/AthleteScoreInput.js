import mongoose from "mongoose";

const AthleteScoreInputSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    sport: {
      type: String,
      required: true,
    },
    training_years: {
      type: Number,
      required: true,
    },
    vo2_max: {
      type: Number,
    },
    hrv: {
      type: Number,
    },
    lactate_threshold: {
      type: Number,
    },
    stride_length: {
      type: Number,
    },
    cadence: {
      type: Number,
    },
    force_application: {
      type: Number,
    },
    performance_score: {
      type: Number,
    },
    adaptability_score: {
      type: Number,
    },
  },
  {
    timestamps: true,
  },
);

const AthleteScoreInput =
  mongoose.models.AthleteScoreInput ||
  mongoose.model("AthleteScoreInput", AthleteScoreInputSchema);

export default AthleteScoreInput;
