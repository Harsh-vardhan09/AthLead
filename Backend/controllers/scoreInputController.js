import AthleteScoreInput from "../models/AthleteScoreInput.js";
import { scoreInputVal } from "../utils/zodValidation.js";

export const saveScoreInput = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const validatedData = scoreInputVal.parse(req.body);

    const scoreInput = await AthleteScoreInput.findOneAndUpdate(
      { user: userId },
      { ...validatedData, user: userId },
      { new: true, upsert: true, runValidators: true },
    );

    return res.json({ success: true, data: scoreInput });
  } catch (error) {
    return next(error);
  }
};

export const getScoreInput = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const scoreInput = await AthleteScoreInput.findOne({ user: userId });

    if (!scoreInput) {
      return res.json({ success: false, message: "No score input found" });
    }

    return res.json({ success: true, data: scoreInput });
  } catch (error) {
    return next(error);
  }
};
