import axios from "axios";
import Score from "../models/Score.js";
import { wrapAsync } from "../middleware/middleware.js";
import { User } from "../models/Users.js";
import dobToAge from "dob-to-age";
import dayjs from "dayjs";
import { success } from "zod";

export const setScore = async (req, res) => {
  const data = req.body;
  const userId = req.user._id;

  console.log(process.env.ML_URI);
  console.log(data);

  try {
    const user = await User.findOne({
      _id: userId,
    }).select("DOB gender");

    // console.log(user);

    if (!user) {
      return res.json({
        success: false,
        message: "User Not Found",
      });
    } else if (!user.DOB) {
      return res.json({
        success: false,
        message: "Please Update profile with Date of Birth for Score",
      });
    }
    const birthDate = dayjs(user.DOB).format("YYYY-MM-DD");

    const age = dobToAge(birthDate);
    console.log(age);

    const gen = user.gender.toUpperCase().slice(0, 1);

    data.age = `${age.count}`;
    data.gender = `${gen}`;

    // console.log(data);

    const mlResponse = await axios.post(`${process.env.ML_URI}/rank`, data);

    const result = await Score.create({
      user: userId,
      score: mlResponse.data.predicted_potential_score,
    });
    console.log(mlResponse.data.predicted_potential_score);

    res.json({
      success: true,
      message: `obtained ${mlResponse.data.predicted_potential_score}`,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const getScore = async (req, res) => {
  const userId = req.user._id;
  // console.log(userId);

  try {
    const scores = await Score.find({
      user: userId,
    });

    // console.log(scores);

    res.json({
      success: true,
      scores,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const getRanking = async (req, res) => {
  try {
    const rank = await Score.find({}).sort({ score: -1 }).populate("user");
    // console.log(rank);

    res.json({
      success: true,
      rank,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};
