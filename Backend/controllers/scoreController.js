import axios from "axios";
import Score from "../models/Score.js";
import { wrapAsync } from "../middleware/middleware.js";
import { Participation } from "../models/Users.js";
import dobToAge from "dob-to-age";
import dayjs from "dayjs";

export const setScore = async (req, res) => {
  const data = req.body;
  const userId = req.user._id;

  console.log(process.env.ML_URI);
  console.log(data);

  try {
    const participant = await Participation.findOne({
      user: userId,
    }).select("DOB gender");

    if (!participant) {
      return res.json({
        success:false,
        message:"You must participate in at least one event before getting a score.",
      });
    }
    const birthDate = dayjs(participant[0].DOB).format("YYYY-MM-DD");

    const age = dobToAge(birthDate);
    console.log(age);

    const gen = participant[0].gender.toUpperCase().slice(0, 1);

    data.age = `${age.count}`;
    data.gender = `${gen}`;

    // console.log(data);

    const mlResponse = await axios.post(`${process.env.ML_URI}/rank`, data);

    const result = await Score.create({
      user: user,
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
  const user = req.user._id;

  try {
    const scores = await Score.find({
      user: user,
    }).sort({ createdAt: 1 });

    console.log(scores);

    res.json({
      success: true,
      scores,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error,
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
