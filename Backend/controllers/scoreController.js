import axios from "axios";
import Score from "../models/Score.js";
import AthleteScoreInput from "../models/AthleteScoreInput.js";
import { User } from "../models/Users.js";
import dobToAge from "dob-to-age";
import dayjs from "dayjs";

const predictionFields = [
  "sport",
  "training_years",
  "vo2_max",
  "hrv",
  "lactate_threshold",
  "stride_length",
  "cadence",
  "force_application",
  "performance_score",
  "adaptability_score",
  "schema_version",
];

export const setScore = async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await User.findOne({ _id: userId }).select("DOB gender");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User Not Found" });
    }

    if (!user.DOB) {
      return res.status(400).json({
        success: false,
        message: "Please Update profile with Date of Birth for Score",
      });
    }

    if (!user.gender) {
      return res.status(400).json({
        success: false,
        message: "Please Update profile with Gender for Score",
      });
    }

    const birthDate = dayjs(user.DOB).format("YYYY-MM-DD");
    const age = dobToAge(birthDate);

    if (!age) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Date of Birth format" });
    }

    if (req.body == null) {
      return res
        .status(400)
        .json({ success: false, message: "Score inputs are required" });
    }

    const gen = user.gender.toUpperCase().slice(0, 1);
    const inputSnapshot = Object.fromEntries(
      predictionFields
        .filter((field) => Object.hasOwn(req.body, field))
        .map((field) => [field, req.body[field]]),
    );
    inputSnapshot.age = `${age.count}`;
    inputSnapshot.gender = `${gen}`;

    const mlResponse = await axios.post(
      `${process.env.ML_URI}/rank`,
      inputSnapshot,
      { timeout: 10000 },
    );

    const predictedScore = mlResponse.data?.predicted_potential_score;
    if (
      typeof predictedScore !== "number" ||
      !Number.isFinite(predictedScore)
    ) {
      return res.status(502).json({
        success: false,
        message: "Score service returned an invalid result",
      });
    }

    const newScore = await Score.create({
      user: userId,
      score: predictedScore,
      sport: inputSnapshot.sport,
      inputSnapshot: { ...inputSnapshot },
      modelVersion: mlResponse.data.model_version ?? null,
    });

    return res.status(201).json({
      success: true,
      message: `Score obtained: ${predictedScore}`,
      data: newScore,
    });
  } catch (error) {
    console.error("Score Generation Error:", error.message);
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      return res.status(504).json({
        success: false,
        message: "Score service timed out. Please try again.",
      });
    }
    const upstreamStatus = error.response?.status;
    if (upstreamStatus && upstreamStatus >= 400 && upstreamStatus < 500) {
      return res.status(upstreamStatus).json({
        success: false,
        message: "Score request was rejected. Please check your inputs.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to generate score. Please try again.",
    });
  }
};

export const getScore = async (req, res) => {
  const userId = req.user._id;
  try {
    const query = Score.find({ user: userId });
    let scores;
    if (query && typeof query.limit === "function") {
      scores = await query.sort({ createdAt: -1 }).limit(100);
    } else {
      scores = await query;
    }
    return res.status(200).json({ success: true, scores });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getRanking = async (req, res) => {
  try {
    const { page, limit } = req.query || {};
    const isPaginated = page !== undefined || limit !== undefined;

    let query = Score.find({})
      .sort({ score: -1, _id: 1 })
      .select("user score")
      .populate("user", "fullname image state gender");

    if (query && typeof query.lean === "function") {
      query = query.lean();
    }

    if (isPaginated) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
      const skip = (pageNum - 1) * limitNum;

      const [rankDocs, total] = await Promise.all([
        query.skip(skip).limit(limitNum).exec
          ? query.skip(skip).limit(limitNum).exec()
          : query.skip(skip).limit(limitNum),
        Score.countDocuments ? Score.countDocuments({}) : Promise.resolve(0),
      ]);

      const userIds = (rankDocs || []).map((r) => r.user?._id).filter(Boolean);
      let scoreInputs = [];
      if (userIds.length > 0 && AthleteScoreInput && AthleteScoreInput.find) {
        try {
          scoreInputs = await AthleteScoreInput.find({
            user: { $in: userIds },
          });
        } catch (e) {
          scoreInputs = [];
        }
      }
      const sportMap = {};
      (scoreInputs || []).forEach((si) => {
        if (si.user) sportMap[si.user.toString()] = si.sport;
      });

      const rank = (rankDocs || []).map((doc, idx) => ({
        ...doc,
        sport:
          doc.sport ||
          (doc.user ? sportMap[doc.user._id.toString()] : null) ||
          "General",
        rank: skip + idx + 1,
      }));

      const totalPages = Math.ceil(total / limitNum);

      return res.status(200).json({
        success: true,
        rank,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasMore: pageNum < totalPages,
        },
      });
    }

    const rankDocs = query.exec ? await query.exec() : await query;
    const userIds = (rankDocs || []).map((r) => r.user?._id).filter(Boolean);
    let scoreInputs = [];
    if (userIds.length > 0 && AthleteScoreInput && AthleteScoreInput.find) {
      try {
        scoreInputs = await AthleteScoreInput.find({
          user: { $in: userIds },
        });
      } catch (e) {
        scoreInputs = [];
      }
    }
    const sportMap = {};
    (scoreInputs || []).forEach((si) => {
      if (si.user) sportMap[si.user.toString()] = si.sport;
    });

    const rank = (rankDocs || []).map((doc, idx) => ({
      ...doc,
      sport:
        doc.sport ||
        (doc.user ? sportMap[doc.user._id.toString()] : null) ||
        "General",
      rank: idx + 1,
    }));

    return res.status(200).json({
      success: true,
      rank,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
