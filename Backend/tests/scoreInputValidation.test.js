import test, { mock } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { scoreInputVal } from "../utils/zodValidation.js";
import { saveScoreInput } from "../controllers/scoreInputController.js";
import AthleteScoreInput from "../models/AthleteScoreInput.js";
import { errorHandler } from "../middleware/errorHandler.js";

test("scoreInputVal accepts valid payload with all metrics", () => {
  const payload = {
    sport: "cycling",
    training_years: 5,
    vo2_max: 45,
    hrv: 65,
    lactate_threshold: 8,
    stride_length: 1.4,
    cadence: 180,
    force_application: 250,
    performance_score: 75,
    adaptability_score: 80,
  };

  const result = scoreInputVal.safeParse(payload);
  assert.equal(result.success, true);
  assert.deepEqual(result.data, payload);
});

test("scoreInputVal accepts valid payload with only required fields", () => {
  const payload = {
    sport: "running",
    training_years: 2,
  };

  const result = scoreInputVal.safeParse(payload);
  assert.equal(result.success, true);
  assert.equal(result.data.sport, "running");
  assert.equal(result.data.training_years, 2);
});

test("scoreInputVal trims sport string and rejects empty/whitespace sport", () => {
  const trimmed = scoreInputVal.safeParse({
    sport: "  swimming  ",
    training_years: 3,
  });
  assert.equal(trimmed.success, true);
  assert.equal(trimmed.data.sport, "swimming");

  const empty = scoreInputVal.safeParse({
    sport: "",
    training_years: 3,
  });
  assert.equal(empty.success, false);

  const whitespace = scoreInputVal.safeParse({
    sport: "   ",
    training_years: 3,
  });
  assert.equal(whitespace.success, false);
});

test("scoreInputVal rejects missing required fields", () => {
  const missingSport = scoreInputVal.safeParse({ training_years: 5 });
  assert.equal(missingSport.success, false);

  const missingTrainingYears = scoreInputVal.safeParse({ sport: "cycling" });
  assert.equal(missingTrainingYears.success, false);
});

test("scoreInputVal rejects invalid data types where numbers are expected", () => {
  const stringTrainingYears = scoreInputVal.safeParse({
    sport: "cycling",
    training_years: "five",
  });
  assert.equal(stringTrainingYears.success, false);

  const stringVo2Max = scoreInputVal.safeParse({
    sport: "cycling",
    training_years: 5,
    vo2_max: "high",
  });
  assert.equal(stringVo2Max.success, false);
});

test("scoreInputVal rejects negative values", () => {
  const negativeTrainingYears = scoreInputVal.safeParse({
    sport: "cycling",
    training_years: -1,
  });
  assert.equal(negativeTrainingYears.success, false);

  const negativeHrv = scoreInputVal.safeParse({
    sport: "cycling",
    training_years: 5,
    hrv: -10,
  });
  assert.equal(negativeHrv.success, false);
});

test("scoreInputVal rejects values above allowed ranges", () => {
  const excessiveTrainingYears = scoreInputVal.safeParse({
    sport: "cycling",
    training_years: 45,
  });
  assert.equal(excessiveTrainingYears.success, false);

  const excessiveCadence = scoreInputVal.safeParse({
    sport: "cycling",
    training_years: 5,
    cadence: 250,
  });
  assert.equal(excessiveCadence.success, false);

  const excessiveVo2Max = scoreInputVal.safeParse({
    sport: "cycling",
    training_years: 5,
    vo2_max: 95,
  });
  assert.equal(excessiveVo2Max.success, false);
});

test("scoreInputVal strips unexpected fields", () => {
  const payload = {
    sport: "running",
    training_years: 4,
    user: "attacker_id",
    role: "ADMIN",
    unknown_metric: 999,
  };

  const parsed = scoreInputVal.parse(payload);
  assert.equal(parsed.sport, "running");
  assert.equal(parsed.training_years, 4);
  assert.equal(parsed.user, undefined);
  assert.equal(parsed.role, undefined);
  assert.equal(parsed.unknown_metric, undefined);
});

test("saveScoreInput persists validated data, preserves req.user._id, and filters unexpected fields", async () => {
  let capturedQuery = null;
  let capturedUpdate = null;

  mock.method(AthleteScoreInput, "findOneAndUpdate", async (query, update) => {
    capturedQuery = query;
    capturedUpdate = update;
    return { ...update, _id: "doc_123" };
  });

  const app = express();
  app.use(express.json());
  app.post(
    "/api/score-inputs",
    (req, res, next) => {
      req.user = { _id: "authenticated_user_456" };
      next();
    },
    saveScoreInput,
  );
  app.use(errorHandler);

  const server = app.listen(0);
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}/api/score-inputs`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sport: "cycling",
        training_years: 4,
        vo2_max: 55,
        user: "hacker_override_id",
        injectedField: "should_not_exist",
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.deepEqual(capturedQuery, { user: "authenticated_user_456" });
    assert.equal(capturedUpdate.user, "authenticated_user_456");
    assert.equal(capturedUpdate.sport, "cycling");
    assert.equal(capturedUpdate.training_years, 4);
    assert.equal(capturedUpdate.vo2_max, 55);
    assert.equal(capturedUpdate.injectedField, undefined);
  } finally {
    server.close();
    mock.reset();
  }
});

test("POST /api/score-inputs returns HTTP 400 with formatted errors on invalid inputs", async () => {
  const app = express();
  app.use(express.json());
  app.post(
    "/api/score-inputs",
    (req, res, next) => {
      req.user = { _id: "test_user" };
      next();
    },
    saveScoreInput,
  );
  app.use(errorHandler);

  const server = app.listen(0);
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}/api/score-inputs`;

  try {
    // Missing required field
    const resMissing = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sport: "cycling" }),
    });
    assert.equal(resMissing.status, 400);
    const bodyMissing = await resMissing.json();
    assert.equal(bodyMissing.success, false);
    assert.equal(bodyMissing.message, "Validation failed");

    // Negative training_years
    const resNegative = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sport: "cycling", training_years: -5 }),
    });
    assert.equal(resNegative.status, 400);

    // Value above allowed range
    const resOutOfRange = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sport: "cycling", training_years: 50 }),
    });
    assert.equal(resOutOfRange.status, 400);

    // Invalid data type
    const resBadType = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sport: "cycling", training_years: "five" }),
    });
    assert.equal(resBadType.status, 400);
  } finally {
    server.close();
  }
});
