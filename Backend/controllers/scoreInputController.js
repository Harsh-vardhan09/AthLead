import AthleteScoreInput from "../models/AthleteScoreInput.js";

export const saveScoreInput = async (req, res) => {
  try {
    const userId = req.user._id;
    const data = req.body;

    const scoreInput = await AthleteScoreInput.findOneAndUpdate(
      { user: userId },
      { ...data, user: userId },
      { new: true, upsert: true, runValidators: true },
    );

    return res.json({ success: true, data: scoreInput });
  } catch (error) {
    console.error("Error saving score input:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const getScoreInput = async (req, res) => {
  try {
    const userId = req.user._id;
    const scoreInput = await AthleteScoreInput.findOne({ user: userId });

    if (!scoreInput) {
      return res.json({ success: false, message: "No score input found" });
    }

    return res.json({ success: true, data: scoreInput });
  } catch (error) {
    console.error("Error fetching score input:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
