import test from "node:test";
import assert from "node:assert/strict";
import Event from "../models/Event.js";
import { findAllEvent } from "../controllers/eventController.js";

// Helper to create mock req, res, next
const createMockReqRes = (query = {}) => {
  const req = { query };
  let resStatus = null;
  let resJson = null;

  const res = {
    status(code) {
      resStatus = code;
      return this;
    },
    json(data) {
      resJson = data;
      return this;
    },
  };

  const next = (err) => {
    if (err) throw err;
  };

  return { req, res, getResult: () => ({ status: resStatus, json: resJson }), next };
};

test("findAllEvent - returns events and pagination when called without query params", async () => {
  const mockEvents = [
    { title: "Event 1", sport: "Hockey", level: "Youth", location: "Delhi", date: new Date() },
    { title: "Event 2", sport: "Cricket", level: "National", location: "Mumbai", date: new Date() },
  ];

  const originalCountDocuments = Event.countDocuments;
  const originalFind = Event.find;

  Event.countDocuments = async () => mockEvents.length;
  Event.find = () => ({
    sort: () => mockEvents,
  });

  try {
    const { req, res, getResult, next } = createMockReqRes();
    await findAllEvent(req, res, next);
    const { status, json } = getResult();

    assert.equal(status, 200);
    assert.equal(json.success, true);
    assert.equal(json.events.length, 2);
    assert.equal(json.pagination.total, 2);
    assert.equal(json.pagination.page, 1);
  } finally {
    Event.countDocuments = originalCountDocuments;
    Event.find = originalFind;
  }
});

test("findAllEvent - constructs correct query for combined filters and pagination", async () => {
  let capturedQuery = null;
  let capturedSkip = null;
  let capturedLimit = null;

  const mockEvents = [
    {
      title: "National Hockey Trials",
      sport: "Hockey",
      level: "National",
      location: "Mumbai",
      date: new Date("2026-10-20"),
    },
  ];

  const originalCountDocuments = Event.countDocuments;
  const originalFind = Event.find;

  Event.countDocuments = async (query) => {
    capturedQuery = query;
    return 1;
  };

  Event.find = () => {
    return {
      sort: () => ({
        skip: (skipVal) => {
          capturedSkip = skipVal;
          return {
            limit: (limitVal) => {
              capturedLimit = limitVal;
              return mockEvents;
            },
          };
        },
      }),
    };
  };

  try {
    const { req, res, getResult, next } = createMockReqRes({
      sport: "Hockey",
      level: "National",
      location: "Mumbai",
      date: "2026-10-20",
      status: "Upcoming",
      search: "Trials",
      page: "2",
      limit: "5",
    });

    await findAllEvent(req, res, next);
    const { status, json } = getResult();

    assert.equal(status, 200);
    assert.equal(json.success, true);
    assert.equal(json.events.length, 1);

    // Verify filter query properties
    assert.ok(capturedQuery.sport.$regex);
    assert.ok(capturedQuery.level.$regex);
    assert.ok(capturedQuery.location.$regex);
    assert.ok(capturedQuery.date);
    assert.ok(capturedQuery.$or);

    // Verify pagination
    assert.equal(capturedSkip, 5); // (page 2 - 1) * limit 5
    assert.equal(capturedLimit, 5);
    assert.equal(json.pagination.page, 2);
    assert.equal(json.pagination.limit, 5);
  } finally {
    Event.countDocuments = originalCountDocuments;
    Event.find = originalFind;
  }
});
