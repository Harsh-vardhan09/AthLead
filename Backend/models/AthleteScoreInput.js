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
      trim: true,
    },
    training_years: {
      type: Number,
      required: true,
      min: 0,
      max: 40,
    },
    vo2_max: {
      type: Number,
      min: 10,
      max: 90,
    },
    hrv: {
      type: Number,
      min: 0,
      max: 200,
    },
    lactate_threshold: {
      type: Number,
      min: 1,
      max: 30,
    },
    stride_length: {
      type: Number,
      min: 0.5,
      max: 3.5,
    },
    cadence: {
      type: Number,
      min: 50,
      max: 220,
    },
    force_application: {
      type: Number,
      min: 1,
      max: 500,
    },
    performance_score: {
      type: Number,
      min: 0,
      max: 100,
    },
    adaptability_score: {
      type: Number,
      min: 0,
      max: 100,
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
