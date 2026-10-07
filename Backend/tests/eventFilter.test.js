import assert from "node:assert/strict";
import test from "node:test";
import Event from "../models/Event.js";
import { findAllEvent } from "../controllers/eventController.js";
import { buildEventQuery } from "../utils/eventQuery.js";

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

test("preserves the unfiltered endpoint response contract", async () => {
  const originalFind = Event.find;
  const events = [{ _id: "event-1" }];

  Event.find = (filter) => {
    assert.deepEqual(filter, {});
    return { exec: async () => events };
  };

  try {
    const response = await invokeController({});

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

test("uses Atlas Search builder for filtered and paginated events", async () => {
  const originalAggregate = Event.aggregate;
  let receivedPipeline;
  const query = {
    q: "trials",
    sport: "Hockey",
    level: "National",
    location: "Mumbai",
    dateFrom: "2026-10-20",
    dateTo: "2026-10-21",
    status: "upcoming",
    page: "2",
    limit: "2",
  };
  const events = [{ _id: "event-3" }, { _id: "event-4" }, { _id: "event-5" }];

  Event.aggregate = (pipeline) => {
    receivedPipeline = pipeline;
    return { exec: async () => events };
  };

  try {
    const response = await invokeController(query);
    const { searchStage, pagination } = buildEventQuery(query);

    assert.deepEqual(receivedPipeline, [
      searchStage,
      { $skip: 2 },
      { $limit: 3 },
    ]);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body.events, events.slice(0, 2));
    assert.deepEqual(response.body.pagination, {
      page: pagination.page,
      limit: pagination.limit,
      hasMore: true,
    });
  } finally {
    Event.aggregate = originalAggregate;
  }
});
