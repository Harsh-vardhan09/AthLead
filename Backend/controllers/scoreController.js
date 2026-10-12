import axios from "axios";
import Score from "../models/Score.js";
import { User } from "../models/Users.js";
import dobToAge from "dob-to-age";
import dayjs from "dayjs";

export const setScore = async (req, res) => {
  const data = req.body;
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

    const gen = user.gender.toUpperCase().slice(0, 1);
    data.age = `${age.count}`;
    data.gender = `${gen}`;

    const mlResponse = await axios.post(`${process.env.ML_URI}/rank`, data);

    const newScore = await Score.create({
      user: userId,
      score: mlResponse.data.predicted_potential_score,
    });

    return res.status(201).json({
      success: true,
      message: `Score obtained: ${mlResponse.data.predicted_potential_score}`,
      data: newScore,
    });
  } catch (error) {
    console.error("Score Generation Error:", error.message);
    return res.status(500).json({
      success: false,
      message:
        error.response?.data?.detail ||
        error.message ||
        "Internal Server Error",
    });
  }
};

export const getScore = async (req, res) => {
  const userId = req.user._id;
  try {
    const scores = await Score.find({ user: userId });
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
      .populate("user", "fullname image role state")
      .lean();

    if (isPaginated) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
      const skip = (pageNum - 1) * limitNum;

      const [rankDocs, total] = await Promise.all([
        query.skip(skip).limit(limitNum).exec(),
        Score.countDocuments({}),
      ]);

      const rank = rankDocs.map((doc, idx) => ({
        ...doc,
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

    const rankDocs = await query.exec();
    const rank = rankDocs.map((doc, idx) => ({
      ...doc,
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
