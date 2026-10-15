import Event from "../models/Event.js";
import { Participation, User } from "../models/Users.js";
import { buildEventQuery } from "../utils/eventQuery.js";
import { filterCurrentAndUpcomingRegistrations } from "../utils/registeredEvents.js";
import { createEventVal, updateEventVal } from "../utils/zodValidation.js";

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
      let total;
      if (searchStage) {
        const countResult = await Event.aggregate([
          searchStage,
          { $count: "total" },
        ]).exec();
        total = countResult[0]?.total ?? 0;
      } else {
        total = await Event.countDocuments({});
      }

      const totalPages = Math.ceil(total / pagination.limit);

      response.pagination = {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasMore: events.length > pagination.limit,
      };
      response.events = events.slice(0, pagination.limit);
    }

    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

//create event
export const createEvent = async (req, res, next) => {
  try {
    const rawData = req.body?.data !== undefined ? req.body.data : req.body;
    const validatedData = req.validatedData || createEventVal.parse(rawData);

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
      capacity,
    } = validatedData;

    const eventDate = new Date(date);

    const deleteAt = new Date(eventDate);
    deleteAt.setUTCDate(deleteAt.getUTCDate() + 3);

    const event = await Event.create({
      title,
      level,
      location,
      prize,
      description,
      sport,
      date: eventDate,
      time,
      tags,
      capacity: capacity !== undefined ? Number(capacity) : undefined,
      registeredCount: 0,
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

export const updateEvent = async (req, res, next) => {
  const { eventId } = req.params;

  try {
    const rawData = req.body?.data !== undefined ? req.body.data : req.body;
    const validatedData = req.validatedData || updateEventVal.parse(rawData);

    let deleteAt;
    if (validatedData.date) {
      const eventDate = new Date(validatedData.date);
      deleteAt = new Date(eventDate);
      deleteAt.setUTCDate(deleteAt.getUTCDate() + 3);
    }

    const updatePayload = {
      ...validatedData,
      ...(deleteAt ? { deleteAt } : {}),
    };

    const event = await Event.findByIdAndUpdate(eventId, updatePayload, {
      new: true,
    });
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
    next(error);
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

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Lightweight contact checks so obvious typos do not reach the database.
    // Missing fields are left to the model layer to preserve existing flows.
    if (email !== undefined && email !== null && email !== "") {
      const emailOk =
        typeof email === "string" &&
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
      if (!emailOk) {
        return res.status(400).json({
          success: false,
          message: "A valid email is required for event registration",
        });
      }
    }

    if (phone !== undefined && phone !== null && phone !== "") {
      const digits = String(phone).replace(/\D/g, "");
      if (digits.length !== 10) {
        return res.status(400).json({
          success: false,
          message: "Phone must be a 10-digit number",
        });
      }
    }

    if (fullname !== undefined && fullname !== null && fullname !== "") {
      if (typeof fullname !== "string" || fullname.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: "Full name is required for event registration",
        });
      }
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

    let capacityIncremented = false;
    if (event.capacity != null) {
      const currentParticipants = await Participation.countDocuments({
        event: eventId,
      });

      if (currentParticipants >= event.capacity) {
        return res.status(400).json({
          success: false,
          message: "Event has reached maximum capacity",
        });
      }

      // Atomic update to increment registeredCount and guard against race conditions
      const updatedEvent = await Event.findOneAndUpdate(
        {
          _id: eventId,
          $or: [
            { registeredCount: { $lt: event.capacity } },
            { registeredCount: { $exists: false } },
          ],
        },
        { $inc: { registeredCount: 1 } },
        { new: true },
      );

      if (!updatedEvent) {
        return res.status(400).json({
          success: false,
          message: "Event has reached maximum capacity",
        });
      }
      capacityIncremented = true;
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

      if (!capacityIncremented) {
        await Event.updateOne(
          { _id: eventId },
          { $inc: { registeredCount: 1 } },
        );
      }
    } catch (error) {
      if (capacityIncremented) {
        await Event.updateOne(
          { _id: eventId, registeredCount: { $gt: 0 } },
          { $inc: { registeredCount: -1 } },
        );
      }

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

    const registrations = filterCurrentAndUpcomingRegistrations(participations)
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

export const cancelEventRegistration = async (req, res, next) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const participation = await Participation.findOneAndDelete({
      user: userId,
      event: eventId,
    });
    if (!participation) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    await Event.updateOne(
      { _id: eventId, registeredCount: { $gt: 0 } },
      { $inc: { registeredCount: -1 } },
    );

    return res.status(200).json({
      success: true,
      message: "Event registration cancelled successfully",
      eventId,
    });
  } catch (error) {
    next(error);
  }
};
