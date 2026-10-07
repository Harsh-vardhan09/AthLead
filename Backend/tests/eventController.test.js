import assert from "node:assert/strict";
import test from "node:test";
import Event from "../models/Event.js";
import { findAllEvent } from "../controllers/eventController.js";

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
