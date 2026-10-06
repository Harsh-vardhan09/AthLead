import Event from "../models/Event.js";
import { Participation, User } from "../models/Users.js";

const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getStringParam = (val) => {
  if (typeof val === "string") return val;
  if (Array.isArray(val) && typeof val[0] === "string") return val[0];
  return "";
};

export const findAllEvent = async (req, res, next) => {
  try {
    const sport = getStringParam(req.query.sport);
    const level = getStringParam(req.query.level);
    const location = getStringParam(req.query.location);
    const date = getStringParam(req.query.date);
    const status = getStringParam(req.query.status);
    const search = getStringParam(req.query.search);
    const pageVal = getStringParam(req.query.page);
    const limitVal = getStringParam(req.query.limit);

    const query = {};

    if (sport && sport !== "All") {
      query.sport = { $regex: new RegExp(`^${escapeRegex(sport)}$`, "i") };
    }

    if (level && level !== "All") {
      query.level = { $regex: new RegExp(`^${escapeRegex(level)}$`, "i") };
    }

    if (location.trim() !== "") {
      query.location = { $regex: escapeRegex(location.trim()), $options: "i" };
    }

    if (date) {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        const startOfDay = new Date(parsedDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(parsedDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        query.date = { $gte: startOfDay, $lte: endOfDay };
      }
    }

    if (status && status !== "All") {
      const now = new Date();
      const startOfToday = new Date(now);
      startOfToday.setUTCHours(0, 0, 0, 0);
      const endOfToday = new Date(now);
      endOfToday.setUTCHours(23, 59, 59, 999);

      const statusLower = status.toLowerCase();
      if (statusLower === "upcoming" || statusLower === "open") {
        query.date = query.date
          ? {
              ...query.date,
              $gte:
                query.date.$gte && query.date.$gte > startOfToday
                  ? query.date.$gte
                  : startOfToday,
            }
          : { $gte: startOfToday };
      } else if (statusLower === "ongoing" || statusLower === "live") {
        if (query.date) {
          const startGte =
            query.date.$gte && query.date.$gte > startOfToday
              ? query.date.$gte
              : startOfToday;
          const endLte =
            query.date.$lte && query.date.$lte < endOfToday
              ? query.date.$lte
              : endOfToday;
          query.date = { $gte: startGte, $lte: endLte };
        } else {
          query.date = { $gte: startOfToday, $lte: endOfToday };
        }
      } else if (
        statusLower === "completed" ||
        statusLower === "closed" ||
        statusLower === "past"
      ) {
        query.date = query.date
          ? {
              ...query.date,
              $lt:
                query.date.$lte && query.date.$lte < startOfToday
                  ? query.date.$lte
                  : startOfToday,
            }
          : { $lt: startOfToday };
      }
    }

    if (search.trim() !== "") {
      const regex = new RegExp(escapeRegex(search.trim()), "i");
      query.$or = [
        { title: regex },
        { description: regex },
        { sport: regex },
        { location: regex },
      ];
    }

    let pageNum = parseInt(pageVal, 10);
    let limitNum = parseInt(limitVal, 10);

    if (isNaN(limitNum) || limitNum <= 0) {
      limitNum = 0;
    }
    if (isNaN(pageNum) || pageNum <= 0) {
      pageNum = 1;
    }

    const total = await Event.countDocuments(query);

    let mongooseQuery = Event.find(query).sort({ date: 1 });

    if (limitNum > 0) {
      mongooseQuery = mongooseQuery.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const events = await mongooseQuery;

    res.status(200).json({
      success: true,
      status: 200,
      events,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum > 0 ? limitNum : total,
        totalPages: limitNum > 0 ? Math.ceil(total / limitNum) || 1 : 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

//create event
export const createEvent = async (req, res, next) => {
  const { data } = req.body;

  const {
    title,
    level,
    location,
    prize,
    description,
    sport,
    date,
    time,
    tags,
  } = data;

  const eventDate = new Date(date);

  const deleteAt = new Date(eventDate);
  deleteAt.setDate(deleteAt.getDate() - 3);

  try {
    const event = await Event.create({
      title,
      level,
      location,
      prize,
      description,
      sport,
      date,
      time,
      tags,
      deleteAt,
    });

    res.json({
      success: true,
      message: "Event Registered",
      event,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await Event.findByIdAndDelete(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }
    res.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateEvent = async (req, res) => {
  const { eventId } = req.params;
  const { data } = req.body;

  const eventDate = new Date(data.date);

  const deleteAt = new Date(eventDate);
  deleteAt.setDate(deleteAt.getDate() - 3);

  try {
    const event = await Event.findByIdAndUpdate(
      eventId,
      {
        ...data,
        deleteAt,
      },
      {
        new: true,
      },
    );
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.json({
      success: true,
      message: "Event updated successfully",
      event: event,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//User register to event
export const registerEvent = async (req, res, next) => {
  const { eventId } = req.params;
  const { email, fullname, phone, gender } = req.body;
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.json({
        success: false,
        message: "User not found. Please log in again.",
      });
    }

    const DOB = user.DOB;

    if (!DOB) {
      return res.json({
        success: false,
        message:
          "Date of birth is missing from your profile. Please update your profile before registering.",
      });
    }

    const alreadyRegistered = await Participation.findOne({
      user: user._id,
      event: eventId,
    });

    if (alreadyRegistered) {
      return res.json({
        success: false,
        message: "user already registerred to event",
      });
    }

    try {
      await Participation.create({
        user: user._id,
        event: eventId,
        email: email || user.email,
        fullname,
        phone,
        gender,
        DOB,
      });
    } catch (error) {
      // Handle MongoDB duplicate-key error
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "User is already registered for this event.",
        });
      }

      throw error;
    }

    res.json({
      success: true,
      message: "Registered to event",
    });
  } catch (error) {
    next(error);
  }
};

// Get events registered by the user
export const getMyEvents = async (req, res, next) => {
  try {
    const participations = await Participation.find({
      user: req.user._id,
    }).populate("event", "title sport date location");

    const registrations = participations
      .map((participation) => ({
        _id: participation._id,
        status: "Registered",
        event: participation.event
          ? {
              _id: participation.event._id,
              name: participation.event.title,
              sport: participation.event.sport,
              date: participation.event.date,
              location: participation.event.location,
            }
          : null,
      }))
      .sort((a, b) => {
        const aDate = a.event?.date ? new Date(a.event.date).getTime() : 0;
        const bDate = b.event?.date ? new Date(b.event.date).getTime() : 0;
        return aDate - bDate;
      });

    res.json(registrations);
  } catch (error) {
    next(error);
  }
};