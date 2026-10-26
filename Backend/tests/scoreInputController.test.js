import test, { mock } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import {
  getScoreInput,
  saveScoreInput,
} from "../controllers/scoreInputController.js";
import AthleteScoreInput from "../models/AthleteScoreInput.js";

const createMockResponse = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
};

test("getScoreInput returns HTTP 404 when no score input exists for the user", async () => {
  const originalFindOne = AthleteScoreInput.findOne;
  let capturedQuery = null;

  AthleteScoreInput.findOne = async (query) => {
    capturedQuery = query;
    return null;
  };

  try {
    const req = {
      user: { _id: "athlete_user_101" },
    };
    const res = createMockResponse();
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    await getScoreInput(req, res, next);

    assert.equal(nextCalled, false);
    assert.deepEqual(capturedQuery, { user: "athlete_user_101" });
    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, {
      success: false,
      message: "No score input found",
    });
  } finally {
    AthleteScoreInput.findOne = originalFindOne;
  }
});

test("getScoreInput returns HTTP 200 with data when score input exists", async () => {
  const originalFindOne = AthleteScoreInput.findOne;
  const mockDoc = {
    _id: "doc_123",
    user: "athlete_user_101",
    sport: "swimming",
    training_years: 4,
    vo2_max: 52,
  };

  AthleteScoreInput.findOne = async () => mockDoc;

  try {
    const req = {
      user: { _id: "athlete_user_101" },
    };
    const res = createMockResponse();
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    await getScoreInput(req, res, next);

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      success: true,
      data: mockDoc,
    });
  } finally {
    AthleteScoreInput.findOne = originalFindOne;
  }
});

test("getScoreInput forwards database query errors to next() middleware", async () => {
  const originalFindOne = AthleteScoreInput.findOne;
  const dbError = new Error("Database query timeout");

  AthleteScoreInput.findOne = async () => {
    throw dbError;
  };

  try {
    const req = {
      user: { _id: "athlete_user_101" },
    };
    const res = createMockResponse();
    let receivedError = null;
    const next = (err) => {
      receivedError = err;
    };

    await getScoreInput(req, res, next);

    assert.equal(receivedError, dbError);
    assert.equal(res.body, null);
  } finally {
    AthleteScoreInput.findOne = originalFindOne;
  }
});

test("saveScoreInput persists valid input with user ID and returns HTTP 200", async () => {
  const originalFindOneAndUpdate = AthleteScoreInput.findOneAndUpdate;
  let capturedQuery = null;
  let capturedUpdate = null;
  let capturedOptions = null;

  AthleteScoreInput.findOneAndUpdate = async (query, update, options) => {
    capturedQuery = query;
    capturedUpdate = update;
    capturedOptions = options;
    return {
      _id: "saved_doc_456",
      ...update,
    };
  };

  try {
    const req = {
      user: { _id: "athlete_user_202" },
      body: {
        sport: "running",
        training_years: 5,
        cadence: 175,
      },
    };
    const res = createMockResponse();
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    await saveScoreInput(req, res, next);

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.deepEqual(capturedQuery, { user: "athlete_user_202" });
    assert.equal(capturedUpdate.user, "athlete_user_202");
    assert.equal(capturedUpdate.sport, "running");
    assert.equal(capturedUpdate.training_years, 5);
    assert.equal(capturedUpdate.cadence, 175);
    assert.deepEqual(capturedOptions, {
      new: true,
      upsert: true,
      runValidators: true,
    });
  } finally {
    AthleteScoreInput.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("saveScoreInput forwards Zod validation error to next() on invalid input", async () => {
  const originalFindOneAndUpdate = AthleteScoreInput.findOneAndUpdate;
  let updateCalled = false;

  AthleteScoreInput.findOneAndUpdate = async () => {
    updateCalled = true;
  };

  try {
    const req = {
      user: { _id: "athlete_user_202" },
      body: {
        sport: "", // sport cannot be empty
        training_years: -2,
      },
    };
    const res = createMockResponse();
    let receivedError = null;
    const next = (err) => {
      receivedError = err;
    };

    await saveScoreInput(req, res, next);

    assert.equal(updateCalled, false);
    assert.notEqual(receivedError, null);
    assert.equal(receivedError.name, "ZodError");
    assert.equal(res.body, null);
  } finally {
    AthleteScoreInput.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("saveScoreInput forwards database errors to next() middleware", async () => {
  const originalFindOneAndUpdate = AthleteScoreInput.findOneAndUpdate;
  const dbError = new Error("Database connection lost");

  AthleteScoreInput.findOneAndUpdate = async () => {
    throw dbError;
  };

  try {
    const req = {
      user: { _id: "athlete_user_202" },
      body: {
        sport: "football",
        training_years: 3,
      },
    };
    const res = createMockResponse();
    let receivedError = null;
    const next = (err) => {
      receivedError = err;
    };

    await saveScoreInput(req, res, next);

    assert.equal(receivedError, dbError);
    assert.equal(res.body, null);
  } finally {
    AthleteScoreInput.findOneAndUpdate = originalFindOneAndUpdate;
  }
});
