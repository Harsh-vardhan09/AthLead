import assert from "node:assert/strict";
import test, { mock } from "node:test";
import mongoose from "mongoose";
import axios from "axios";
import Score from "../models/Score.js";
import { User } from "../models/Users.js";
import { getScore, setScore } from "../controllers/scoreController.js";

const response = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("score creation saves the exact prediction inputs and model version", async () => {
  const submitted = {
    sport: "cycling",
    training_years: "4",
    vo2_max: "50",
    hrv: "60",
    lactate_threshold: "5",
    stride_length: "1.4",
    cadence: "175",
    force_application: "250",
    performance_score: "80",
    adaptability_score: "75",
    age: "999",
    gender: "X",
    ignored_field: "do not persist",
  };
  let predictionInput;
  let savedScore;
  const profile = { DOB: new Date("2000-01-01"), gender: "female" };

  mock.method(User, "findOne", () => ({
    select: async () => profile,
  }));
  mock.method(axios, "post", async (_url, input) => {
    predictionInput = input;
    return {
      data: {
        predicted_potential_score: 81.5,
        model_version: "sha256:abcdef",
      },
    };
  });
  mock.method(Score, "create", async (score) => {
    savedScore = score;
    return score;
  });

  try {
    const res = response();
    await setScore({ body: submitted, user: { _id: "user-123" } }, res);

    assert.equal(res.statusCode, 201);
    assert.equal(savedScore.score, 81.5);
    assert.equal(savedScore.user, "user-123");
    assert.equal(savedScore.sport, "cycling");
    assert.equal(savedScore.modelVersion, "sha256:abcdef");
    assert.deepEqual(savedScore.inputSnapshot, predictionInput);
    assert.notStrictEqual(savedScore.inputSnapshot, submitted);
    assert.equal(predictionInput.gender, "F");
    assert.match(predictionInput.age, /^\d+$/);
    assert.notEqual(predictionInput.age, "999");
    assert.equal(predictionInput.ignored_field, undefined);
    assert.equal(submitted.gender, "X");
    assert.equal(submitted.age, "999");
    profile.gender = "male";
    assert.equal(savedScore.inputSnapshot.gender, "F");
  } finally {
    mock.reset();
  }
});

test("score generation still works with an older ML response", async () => {
  let savedScore;
  mock.method(User, "findOne", () => ({
    select: async () => ({ DOB: new Date("2000-01-01"), gender: "female" }),
  }));
  mock.method(axios, "post", async () => ({
    data: { predicted_potential_score: 70 },
  }));
  mock.method(Score, "create", async (score) => {
    savedScore = score;
    return score;
  });

  try {
    const res = response();
    await setScore(
      { body: { sport: "cycling" }, user: { _id: "user-123" } },
      res,
    );
    assert.equal(res.statusCode, 201);
    assert.equal(savedScore.score, 70);
    assert.equal(savedScore.modelVersion, null);
  } finally {
    mock.reset();
  }
});

test("score generation rejects a missing request body before contacting ML", async () => {
  let contactedMl = false;
  mock.method(User, "findOne", () => ({
    select: async () => ({ DOB: new Date("2000-01-01"), gender: "female" }),
  }));
  mock.method(axios, "post", async () => {
    contactedMl = true;
  });

  try {
    const res = response();
    await setScore({ user: { _id: "user-123" } }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(contactedMl, false);
  } finally {
    mock.reset();
  }
});

test("legacy score records remain readable and new metadata is optional", async () => {
  const user = new mongoose.Types.ObjectId();
  const legacy = Score.hydrate({ user, score: 72 });
  assert.equal(legacy.score, 72);
  assert.equal(legacy.inputSnapshot, undefined);
  assert.equal(legacy.sport, undefined);
  assert.equal(legacy.modelVersion, undefined);
  assert.equal(Score.schema.options.timestamps, true);

  mock.method(Score, "find", async () => [legacy]);
  try {
    const res = response();
    await getScore({ user: { _id: user } }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.scores, [legacy]);
  } finally {
    mock.reset();
  }
});
