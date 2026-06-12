import Event from "../models/Event.js";
import { Participation, User } from "../models/Users.js";

export const findAllEvent = async (req, res) => {
  try {
    const events = await Event.find({});
    // console.log(events);

    res.json({
      status: 400,
      events,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const postEvent = async (req, res) => {
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
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const registerEvent = async (req, res) => {
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

    await Participation.create({
      user: user._id,
      event: eventId,
      email: email || user.email,
      fullname,
      phone,
      gender,
      DOB,
    });

    res.json({
      success: true,
      message: "Registered to event",
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyEvents = async (req, res) => {
  try {
    const participations = await Participation.find({
      user: req.user._id,
    }).populate("event", "title sport date location");

    const registrations = participations.map((participation) => ({
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
    })).sort((a, b) => {
      const aDate = a.event?.date ? new Date(a.event.date).getTime() : 0;
      const bDate = b.event?.date ? new Date(b.event.date).getTime() : 0;
      return aDate - bDate;
    });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
