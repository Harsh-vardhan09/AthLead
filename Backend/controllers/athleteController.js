import { User, Participation } from "../models/Users.js";
import Score from "../models/Score.js";
import dayjs from "dayjs";

export const getAthletes = async (req, res, next) => {
  try {
    const { search, q, status } = req.query;
    const searchTerm = (search || q || "").trim();

    // Query for athlete users (non-admin)
    const userQuery = {
      role: { $ne: "ADMIN" },
    };

    if (status && status !== "All") {
      userQuery.status = status;
    }

    if (searchTerm) {
      const regex = new RegExp(searchTerm, "i");
      userQuery.$or = [{ fullname: regex }, { email: regex }];
    }

    const users = await User.find(userQuery).select("-password").lean();

    // Fetch scores to compute score & rank
    const allScores = await Score.find({})
      .sort({ score: -1, _id: 1 })
      .lean();

    // Map each user to their rank and top score
    const userScoreMap = new Map();
    allScores.forEach((s, idx) => {
      const uId = s.user?.toString();
      if (uId && !userScoreMap.has(uId)) {
        userScoreMap.set(uId, {
          potentialScore: s.score,
          currentRank: idx + 1,
          trend: "+0",
        });
      }
    });

    // Fetch participations for these users
    const userIds = users.map((u) => u._id);
    const participations = await Participation.find({ user: { $in: userIds } })
      .populate("event", "title date")
      .lean();

    const userParticipationMap = new Map();
    participations.forEach((p) => {
      const uId = p.user?.toString();
      if (!userParticipationMap.has(uId)) {
        userParticipationMap.set(uId, []);
      }
      userParticipationMap.get(uId).push({
        id: p._id.toString(),
        title: p.event?.title || "Competition Event",
        date: p.event?.date
          ? dayjs(p.event.date).format("YYYY-MM-DD")
          : "Upcoming",
        result: "Participant",
      });
    });

    const athletes = users.map((user) => {
      const userIdStr = user._id.toString();
      const scoreSummary = userScoreMap.get(userIdStr) || {
        potentialScore: 0,
        currentRank: "-",
        trend: "0",
      };

      const eventParticipation = userParticipationMap.get(userIdStr) || [];

      return {
        _id: user._id,
        id: userIdStr,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone ? String(user.phone) : "",
        gender: user.gender || "Not specified",
        state: user.state || "Not specified",
        DOB: user.DOB ? dayjs(user.DOB).format("YYYY-MM-DD") : "N/A",
        status: user.status || "Active",
        scoreSummary,
        eventParticipation,
        accountType: user.role === "ADMIN" ? "Admin" : "Athlete",
        joinDate: user.createdAt
          ? dayjs(user.createdAt).format("YYYY-MM-DD")
          : "N/A",
        image:
          user.image ||
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQw3k1c6JaNUexk2h38jFUHu4j3O73P8mgVkw&s",
      };
    });

    res.status(200).json({
      success: true,
      count: athletes.length,
      athletes,
    });
  } catch (error) {
    next(error);
  }
};

export const getAthleteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password").lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Athlete not found",
      });
    }

    const allScores = await Score.find({})
      .sort({ score: -1, _id: 1 })
      .lean();

    let scoreSummary = {
      potentialScore: 0,
      currentRank: "-",
      trend: "0",
    };

    const rankIdx = allScores.findIndex(
      (s) => s.user?.toString() === id.toString(),
    );
    if (rankIdx !== -1) {
      scoreSummary = {
        potentialScore: allScores[rankIdx].score,
        currentRank: rankIdx + 1,
        trend: "+0",
      };
    }

    const participations = await Participation.find({ user: user._id })
      .populate("event", "title date")
      .lean();

    const eventParticipation = participations.map((p) => ({
      id: p._id.toString(),
      title: p.event?.title || "Competition Event",
      date: p.event?.date
        ? dayjs(p.event.date).format("YYYY-MM-DD")
        : "Upcoming",
      result: "Participant",
    }));

    const athlete = {
      _id: user._id,
      id: user._id.toString(),
      fullname: user.fullname,
      email: user.email,
      phone: user.phone ? String(user.phone) : "",
      gender: user.gender || "Not specified",
      state: user.state || "Not specified",
      DOB: user.DOB ? dayjs(user.DOB).format("YYYY-MM-DD") : "N/A",
      status: user.status || "Active",
      scoreSummary,
      eventParticipation,
      accountType: user.role === "ADMIN" ? "Admin" : "Athlete",
      joinDate: user.createdAt
        ? dayjs(user.createdAt).format("YYYY-MM-DD")
        : "N/A",
      image:
        user.image ||
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQw3k1c6JaNUexk2h38jFUHu4j3O73P8mgVkw&s",
    };

    res.status(200).json({
      success: true,
      athlete,
    });
  } catch (error) {
    next(error);
  }
};
