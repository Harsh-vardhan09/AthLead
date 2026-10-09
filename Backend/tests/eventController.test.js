import assert from "node:assert/strict";
import test from "node:test";
import Event from "../models/Event.js";
import { Participation, User } from "../models/Users.js";
import { findAllEvent, registerEvent } from "../controllers/eventController.js";
import { errorHandler } from "../middleware/errorHandler.js";

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
      hasMore: true,
    });
  } finally {
    Event.aggregate = originalAggregate;
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
  const originalParticipationFindOne = Participation.findOne;
  const originalParticipationCreate = Participation.create;

  const mockUser = {
    _id: "user-123",
    email: "athlete@example.com",
    DOB: new Date("2000-01-01"),
  };
  let capturedParticipation = null;

  User.findById = async () => mockUser;
  Event.findById = async () => ({
    _id: "507f1f77bcf86cd799439011",
    title: "National Championship",
  });
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
  } finally {
    User.findById = originalUserFindById;
    Event.findById = originalEventFindById;
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
