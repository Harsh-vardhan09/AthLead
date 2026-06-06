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

  const { title, level, location, prize, description, sport, date, tags } =
    data;

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