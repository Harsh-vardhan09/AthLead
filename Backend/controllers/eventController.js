import Event from "../models/Event.js";
import { Participation, User } from "../models/Users.js";
import { buildEventQuery } from "../utils/eventQuery.js";

export const findAllEvent = async (req, res, next) => {
  try {
    const { searchStage, pagination } = buildEventQuery(req.query);
    let events;

    if (searchStage) {
      const pipeline = [searchStage];
      if (pagination) {
        pipeline.push(
          { $skip: (pagination.page - 1) * pagination.limit },
          { $limit: pagination.limit + 1 },
        );
      }
      events = await Event.aggregate(pipeline).exec();
    } else {
      let eventQuery = Event.find({});
      if (pagination) {
        eventQuery = eventQuery
          .sort({ date: 1, _id: 1 })
          .skip((pagination.page - 1) * pagination.limit)
          .limit(pagination.limit + 1);
      }
      events = await eventQuery.exec();
    }

    const response = {
      success: true,
      status: 200,
      events,
    };

    if (pagination) {
      response.pagination = {
        page: pagination.page,
        limit: pagination.limit,
        hasMore: events.length > pagination.limit,
      };
      response.events = events.slice(0, pagination.limit);
    }

    res.status(200).json(response);
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
