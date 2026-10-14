import assert from "node:assert/strict";
import test from "node:test";
import Event from "../models/Event.js";
import { Participation, User } from "../models/Users.js";
import {
  createEvent,
  findAllEvent,
  getMyEvents,
  registerEvent,
  updateEvent,
} from "../controllers/eventController.js";
import { errorHandler } from "../middleware/errorHandler.js";
import { cancelEventRegistration } from "../controllers/eventController.js";

const invokeController = async (query) => {
  const response = {
    statusCode: null,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  await findAllEvent({ query }, response, (error) => {
    throw error;
  });

  return response;
};

const invokeRegisterEvent = async (
  { params = {}, body = {}, user = { _id: "user-123" } } = {},
  options = {},
) => {
  const response = {
    statusCode: null,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  let nextError = null;
  const next = (error) => {
    nextError = error;
    if (options.useErrorHandler && error) {
      errorHandler(error, { params, body, user }, response, () => {});
    }
  };

  await registerEvent({ params, body, user }, response, next);

  return { response, nextError };
};

test("createEvent retains a new event until three days after its date", async () => {
  const originalCreate = Event.create;
  let createdEvent;
  let responseBody;
  let nextError;
  Event.create = async (event) => {
    createdEvent = event;
    return event;
  };

  try {
    await createEvent(
      { validatedData: { date: "2026-10-20T12:00:00.000Z" } },
      {
        json(body) {
          responseBody = body;
        },
      },
      (error) => {
        nextError = error;
      },
    );

    assert.equal(nextError, undefined);
    assert.equal(responseBody.success, true);
    assert.equal(createdEvent.date.toISOString(), "2026-10-20T12:00:00.000Z");
    assert.equal(
      createdEvent.deleteAt.toISOString(),
      "2026-10-23T12:00:00.000Z",
    );
  } finally {
    Event.create = originalCreate;
  }
});

test("updateEvent moves retention when the event date changes", async () => {
  const originalUpdate = Event.findByIdAndUpdate;
  let updatedEvent;
  let nextError;
  Event.findByIdAndUpdate = async (_id, event) => {
    updatedEvent = event;
    return event;
  };

  try {
    await updateEvent(
      {
        params: { eventId: "event-123" },
        validatedData: { date: "2026-10-31T12:00:00.000Z" },
      },
      { json() {} },
      (error) => {
        nextError = error;
      },
    );

    assert.equal(nextError, undefined);
    assert.equal(
      updatedEvent.deleteAt.toISOString(),
      "2026-11-03T12:00:00.000Z",
    );
  } finally {
    Event.findByIdAndUpdate = originalUpdate;
  }
});

test("preserves the unfiltered endpoint response contract", async () => {
  const originalFind = Event.find;
  let receivedFilter;
  const events = [{ _id: "event-1" }];

  Event.find = (filter) => {
    receivedFilter = filter;
    return { exec: async () => events };
  };

  try {
    const response = await invokeController({});

    assert.deepEqual(receivedFilter, {});
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, {
      success: true,
      status: 200,
      events,
    });
  } finally {
    Event.find = originalFind;
  }
});

test("uses Atlas Search and returns paginated matching events", async () => {
  const originalAggregate = Event.aggregate;
  let receivedPipeline;
  const docs = [{ _id: "event-1" }, { _id: "event-2" }, { _id: "event-3" }];

  Event.aggregate = (pipeline) => {
    if (pipeline.some((stage) => stage.$count)) {
      return { exec: async () => [{ total: docs.length }] };
    }
    receivedPipeline = pipeline;
    return { exec: async () => docs };
  };

  try {
    const response = await invokeController({
      sport: "Athletics",
      page: "1",
      limit: "2",
    });

    assert.equal(receivedPipeline.length, 3);
    assert.ok(receivedPipeline[0].$search);
    assert.deepEqual(receivedPipeline.slice(1), [{ $skip: 0 }, { $limit: 3 }]);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body.events, docs.slice(0, 2));
    assert.deepEqual(response.body.pagination, {
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
      hasMore: true,
    });
  } finally {
    Event.aggregate = originalAggregate;
  }
});

test("getMyEvents hides past or invalid events without deleting registrations", async (context) => {
  const originalParticipationFind = Participation.find;
  context.mock.timers.enable({
    apis: ["Date"],
    now: new Date("2026-10-13T10:00:00.000Z"),
  });
  const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const todayKey = istNow.toISOString().slice(0, 10);
  const makeDate = (offsetDays) => {
    const date = new Date(`${todayKey}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + offsetDays);
    return date;
  };
  const participations = [
    {
      _id: "past-registration",
      event: { _id: "past-event", date: makeDate(-1) },
    },
    {
      _id: "today-registration",
      event: {
        _id: "today-event",
        title: "Today event",
        sport: "Running",
        date: makeDate(0),
        location: "Stadium",
      },
    },
    {
      _id: "future-registration",
      event: {
        _id: "future-event",
        title: "Future event",
        sport: "Running",
        date: makeDate(1),
        location: "Stadium",
      },
    },
    {
      _id: "invalid-date-registration",
      event: { _id: "invalid-date-event", date: "not-a-date" },
    },
    {
      _id: "missing-date-registration",
      event: { _id: "missing-date-event", date: null },
    },
    { _id: "deleted-event-registration", event: null },
  ];
  let receivedFilter;
  let receivedPopulate;
  Participation.find = (filter) => {
    receivedFilter = filter;
    return {
      populate: async (...args) => {
        receivedPopulate = args;
        return participations;
      },
    };
  };

  const response = {
    body: null,
    json(body) {
      this.body = body;
      return this;
    },
  };

  try {
    await getMyEvents({ user: { _id: "user-123" } }, response, (error) => {
      throw error;
    });

    assert.deepEqual(receivedFilter, { user: "user-123" });
    assert.deepEqual(receivedPopulate, ["event", "title sport date location"]);
    assert.deepEqual(
      response.body.map(({ _id, event }) => [_id, event._id]),
      [
        ["today-registration", "today-event"],
        ["future-registration", "future-event"],
      ],
    );
  } finally {
    Participation.find = originalParticipationFind;
    context.mock.timers.reset();
  }
});

test("Test A — Event does not exist returns HTTP 404 and does not create participation", async () => {
  const originalUserFindById = User.findById;
  const originalEventFindById = Event.findById;
  const originalParticipationCreate = Participation.create;

  let participationCreateCalled = false;
  User.findById = async () => ({
    _id: "user-123",
    email: "athlete@example.com",
    DOB: new Date("2000-01-01"),
  });
  Event.findById = async () => null;
  Participation.create = async () => {
    participationCreateCalled = true;
    return {};
  };

  try {
    const { response, nextError } = await invokeRegisterEvent({
      params: { eventId: "507f1f77bcf86cd799439011" },
      body: {
        fullname: "Athlete One",
        email: "athlete@example.com",
        phone: 9876543210,
        gender: "Male",
      },
    });

    assert.equal(nextError, null);
    assert.equal(response.statusCode, 404);
    assert.deepEqual(response.body, {
      success: false,
      message: "Event not found",
    });
    assert.equal(participationCreateCalled, false);
  } finally {
    User.findById = originalUserFindById;
    Event.findById = originalEventFindById;
    Participation.create = originalParticipationCreate;
  }
});

test("Test B — Existing event registration succeeds and creates participation record", async () => {
  const originalUserFindById = User.findById;
  const originalEventFindById = Event.findById;
  const originalEventUpdateOne = Event.updateOne;
  const originalParticipationFindOne = Participation.findOne;
  const originalParticipationCreate = Participation.create;

  const mockUser = {
    _id: "user-123",
    email: "athlete@example.com",
    DOB: new Date("2000-01-01"),
  };
  let capturedParticipation = null;
  let capturedEventUpdate = null;

  User.findById = async () => mockUser;
  Event.findById = async () => ({
    _id: "507f1f77bcf86cd799439011",
    title: "National Championship",
  });
  Event.updateOne = async (filter, update) => {
    capturedEventUpdate = { filter, update };
    return { acknowledged: true, modifiedCount: 1 };
  };
  Participation.findOne = async () => null;
  Participation.create = async (doc) => {
    capturedParticipation = doc;
    return { _id: "part-123", ...doc };
  };

  try {
    const { response, nextError } = await invokeRegisterEvent({
      params: { eventId: "507f1f77bcf86cd799439011" },
      body: {
        fullname: "Athlete One",
        email: "athlete@example.com",
        phone: 9876543210,
        gender: "Male",
      },
    });

    assert.equal(nextError, null);
    assert.deepEqual(response.body, {
      success: true,
      message: "Registered to event",
    });
    assert.ok(capturedParticipation);
    assert.equal(capturedParticipation.user, "user-123");
    assert.equal(capturedParticipation.event, "507f1f77bcf86cd799439011");
    assert.equal(capturedParticipation.fullname, "Athlete One");
    assert.equal(capturedParticipation.phone, 9876543210);
    assert.equal(capturedParticipation.gender, "Male");
    assert.equal(capturedParticipation.DOB, mockUser.DOB);
    assert.deepEqual(capturedEventUpdate, {
      filter: { _id: "507f1f77bcf86cd799439011" },
      update: { $inc: { registeredCount: 1 } },
    });
  } finally {
    User.findById = originalUserFindById;
    Event.findById = originalEventFindById;
    Event.updateOne = originalEventUpdateOne;
    Participation.findOne = originalParticipationFindOne;
    Participation.create = originalParticipationCreate;
  }
});

test("Test C — Duplicate registration remains handled via pre-check and duplicate-key error", async () => {
  const originalUserFindById = User.findById;
  const originalEventFindById = Event.findById;
  const originalParticipationFindOne = Participation.findOne;
  const originalParticipationCreate = Participation.create;

  User.findById = async () => ({
    _id: "user-123",
    email: "athlete@example.com",
    DOB: new Date("2000-01-01"),
  });
  Event.findById = async () => ({
    _id: "507f1f77bcf86cd799439011",
    title: "National Championship",
  });

  try {
    // 1. Pre-check detects existing participation
    Participation.findOne = async () => ({ _id: "existing-part" });
    let createCalled = false;
    Participation.create = async () => {
      createCalled = true;
    };

    const resPrecheck = await invokeRegisterEvent({
      params: { eventId: "507f1f77bcf86cd799439011" },
    });
    assert.deepEqual(resPrecheck.response.body, {
      success: false,
      message: "user already registerred to event",
    });
    assert.equal(createCalled, false);

    // 2. Race condition duplicate-key error (11000) returns 409
    Participation.findOne = async () => null;
    Participation.create = async () => {
      const duplicateError = new Error("E11000 duplicate key error");
      duplicateError.code = 11000;
      throw duplicateError;
    };

    const resDuplicateKey = await invokeRegisterEvent({
      params: { eventId: "507f1f77bcf86cd799439011" },
    });
    assert.equal(resDuplicateKey.response.statusCode, 409);
    assert.deepEqual(resDuplicateKey.response.body, {
      success: false,
      message: "User is already registered for this event.",
    });
  } finally {
    User.findById = originalUserFindById;
    Event.findById = originalEventFindById;
    Participation.findOne = originalParticipationFindOne;
    Participation.create = originalParticipationCreate;
  }
});

test("Test D — Invalid ObjectId behavior is forwarded and handled by error middleware", async () => {
  const originalUserFindById = User.findById;
  User.findById = async () => ({
    _id: "user-123",
    email: "athlete@example.com",
    DOB: new Date("2000-01-01"),
  });

  try {
    // Real Mongoose Event.findById("invalid-id") throws CastError
    const { response, nextError } = await invokeRegisterEvent(
      { params: { eventId: "invalid-id" } },
      { useErrorHandler: true },
    );

    assert.ok(nextError);
    assert.equal(nextError.name, "CastError");
    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.body, {
      success: false,
      message: "Invalid value for _id",
    });
  } finally {
    User.findById = originalUserFindById;
  }
});

test("Test E — Unexpected database failure is forwarded to error handler and not converted to 404", async () => {
  const originalUserFindById = User.findById;
  const originalEventFindById = Event.findById;
  const originalConsoleError = console.error;

  User.findById = async () => ({
    _id: "user-123",
    email: "athlete@example.com",
    DOB: new Date("2000-01-01"),
  });
  Event.findById = async () => {
    throw new Error("Database connection lost");
  };
  console.error = () => {};

  try {
    const { response, nextError } = await invokeRegisterEvent(
      { params: { eventId: "507f1f77bcf86cd799439011" } },
      { useErrorHandler: true },
    );

    assert.ok(nextError);
    assert.equal(nextError.message, "Database connection lost");
    assert.notEqual(response.statusCode, 404);
    assert.equal(response.statusCode, 500);
    assert.equal(response.body.success, false);
    assert.equal(response.body.message, "Internal server error");
  } finally {
    User.findById = originalUserFindById;
    Event.findById = originalEventFindById;
    console.error = originalConsoleError;
  }
});

test("Test F — Event registration rejects with HTTP 400 when event has reached maximum capacity", async () => {
  const originalUserFindById = User.findById;
  const originalEventFindById = Event.findById;
  const originalParticipationFindOne = Participation.findOne;
  const originalParticipationCount = Participation.countDocuments;
  const originalParticipationCreate = Participation.create;

  User.findById = async () => ({
    _id: "user-123",
    email: "athlete@example.com",
    DOB: new Date("2000-01-01"),
  });
  Event.findById = async () => ({
    _id: "507f1f77bcf86cd799439011",
    capacity: 10,
  });
  Participation.findOne = async () => null;
  Participation.countDocuments = async () => 10;
  let createCalled = false;
  Participation.create = async () => {
    createCalled = true;
  };

  try {
    const { response, nextError } = await invokeRegisterEvent({
      params: { eventId: "507f1f77bcf86cd799439011" },
      body: {
        fullname: "Athlete One",
        email: "athlete@example.com",
        phone: 9876543210,
        gender: "Male",
      },
    });

    assert.equal(nextError, null);
    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.body, {
      success: false,
      message: "Event has reached maximum capacity",
    });
    assert.equal(createCalled, false);
  } finally {
    User.findById = originalUserFindById;
    Event.findById = originalEventFindById;
    Participation.findOne = originalParticipationFindOne;
    Participation.countDocuments = originalParticipationCount;
    Participation.create = originalParticipationCreate;
  }
});

test("Test G — Event registration with capacity limit increments registeredCount atomically", async () => {
  const originalUserFindById = User.findById;
  const originalEventFindById = Event.findById;
  const originalEventFindOneAndUpdate = Event.findOneAndUpdate;
  const originalParticipationFindOne = Participation.findOne;
  const originalParticipationCount = Participation.countDocuments;
  const originalParticipationCreate = Participation.create;

  let capturedFindOneAndUpdate = null;
  let capturedParticipation = null;

  User.findById = async () => ({
    _id: "user-123",
    email: "athlete@example.com",
    DOB: new Date("2000-01-01"),
  });
  Event.findById = async () => ({
    _id: "507f1f77bcf86cd799439011",
    capacity: 10,
  });
  Participation.findOne = async () => null;
  Participation.countDocuments = async () => 4;
  Event.findOneAndUpdate = async (filter, update, options) => {
    capturedFindOneAndUpdate = { filter, update, options };
    return { _id: "507f1f77bcf86cd799439011", registeredCount: 5 };
  };
  Participation.create = async (doc) => {
    capturedParticipation = doc;
    return { _id: "part-123", ...doc };
  };

  try {
    const { response, nextError } = await invokeRegisterEvent({
      params: { eventId: "507f1f77bcf86cd799439011" },
      body: {
        fullname: "Athlete One",
        email: "athlete@example.com",
        phone: 9876543210,
        gender: "Male",
      },
    });

    assert.equal(nextError, null);
    assert.deepEqual(response.body, {
      success: true,
      message: "Registered to event",
    });
    assert.ok(capturedParticipation);
    assert.ok(capturedFindOneAndUpdate);
    assert.deepEqual(capturedFindOneAndUpdate.update, {
      $inc: { registeredCount: 1 },
    });
  } finally {
    User.findById = originalUserFindById;
    Event.findById = originalEventFindById;
    Event.findOneAndUpdate = originalEventFindOneAndUpdate;
    Participation.findOne = originalParticipationFindOne;
    Participation.countDocuments = originalParticipationCount;
    Participation.create = originalParticipationCreate;
  }
});

const invokeCancelEventRegistration = async (
  { params = {}, body = {}, user = { _id: "user-123" } } = {},
  options = {},
) => {
  const response = {
    statusCode: null,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  let nextError = null;
  const next = (error) => {
    nextError = error;
    if (options.useErrorHandler && error) {
      errorHandler(error, { params, body, user }, response, () => {});
    }
  };
  await cancelEventRegistration({ params, body, user }, response, next);
  return { response, nextError };
};

test("cancelEventRegistration — returns HTTP 404 if event does not exist", async () => {
  const originalEventFindById = Event.findById;
  const originalParticipationFindOneAndDelete = Participation.findOneAndDelete;
  let deleteCalled = false;
  Event.findById = async () => null;
  Participation.findOneAndDelete = async () => {
    deleteCalled = true;
    return null;
  };

  try {
    const { response, nextError } = await invokeCancelEventRegistration({
      params: { eventId: "507f1f77bcf86cd799439011" },
      user: { _id: "user-123" },
    });

    assert.equal(nextError, null);
    assert.equal(response.statusCode, 404);
    assert.deepEqual(response.body, {
      success: false,
      message: "Event not found",
    });
    assert.equal(deleteCalled, false);
  } finally {
    Event.findById = originalEventFindById;
    Participation.findOneAndDelete = originalParticipationFindOneAndDelete;
  }
});

test("cancelEventRegistration — returns HTTP 404 if user has no registration for event", async () => {
  const originalEventFindById = Event.findById;
  const originalParticipationFindOneAndDelete = Participation.findOneAndDelete;
  let receivedFilter;
  Event.findById = async () => ({ _id: "507f1f77bcf86cd799439011" });
  Participation.findOneAndDelete = async (filter) => {
    receivedFilter = filter;
    return null;
  };

  try {
    const { response, nextError } = await invokeCancelEventRegistration({
      params: { eventId: "507f1f77bcf86cd799439011" },
      user: { _id: "user-123" },
    });

    assert.equal(nextError, null);
    assert.equal(response.statusCode, 404);
    assert.deepEqual(response.body, {
      success: false,
      message: "Registration not found",
    });
    assert.deepEqual(receivedFilter, {
      user: "user-123",
      event: "507f1f77bcf86cd799439011",
    });
  } finally {
    Event.findById = originalEventFindById;
    Participation.findOneAndDelete = originalParticipationFindOneAndDelete;
  }
});

test("cancelEventRegistration — deletes only the authenticated user's participation", async () => {
  const originalEventFindById = Event.findById;
  const originalEventUpdateOne = Event.updateOne;
  const originalParticipationFindOneAndDelete = Participation.findOneAndDelete;
  let receivedFilter;
  let capturedEventUpdate = null;
  Event.findById = async () => ({ _id: "507f1f77bcf86cd799439011" });
  Event.updateOne = async (filter, update) => {
    capturedEventUpdate = { filter, update };
    return { acknowledged: true, modifiedCount: 1 };
  };
  Participation.findOneAndDelete = async (filter) => {
    receivedFilter = filter;
    return { _id: "participation-123", ...filter };
  };

  try {
    const { response, nextError } = await invokeCancelEventRegistration({
      params: { eventId: "507f1f77bcf86cd799439011" },
      user: { _id: "user-123" },
    });

    assert.equal(nextError, null);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, {
      success: true,
      message: "Event registration cancelled successfully",
      eventId: "507f1f77bcf86cd799439011",
    });
    assert.deepEqual(receivedFilter, {
      user: "user-123",
      event: "507f1f77bcf86cd799439011",
    });
    assert.deepEqual(capturedEventUpdate, {
      filter: {
        _id: "507f1f77bcf86cd799439011",
        registeredCount: { $gt: 0 },
      },
      update: { $inc: { registeredCount: -1 } },
    });
  } finally {
    Event.findById = originalEventFindById;
    Event.updateOne = originalEventUpdateOne;
    Participation.findOneAndDelete = originalParticipationFindOneAndDelete;
  }
});

test("cancelEventRegistration — unexpected error is passed to next() middleware", async () => {
  const originalEventFindById = Event.findById;
  const originalParticipationFindOneAndDelete = Participation.findOneAndDelete;
  Event.findById = async () => ({ _id: "507f1f77bcf86cd799439011" });
  Participation.findOneAndDelete = async () => {
    throw new Error("Database connection error");
  };

  try {
    const { response, nextError } = await invokeCancelEventRegistration(
      {
        params: { eventId: "507f1f77bcf86cd799439011" },
        user: { _id: "user-123" },
      },
      { useErrorHandler: true },
    );
    assert.ok(nextError);
    assert.equal(nextError.message, "Database connection error");
    assert.equal(response.statusCode, 500);
    assert.equal(response.body.success, false);
  } finally {
    Event.findById = originalEventFindById;
    Participation.findOneAndDelete = originalParticipationFindOneAndDelete;
  }
});
