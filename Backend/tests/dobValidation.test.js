import assert from "node:assert/strict";
import test, { mock } from "node:test";
import {
  signupVal,
  createSignupSchema,
  getIstTodayDateString,
} from "../utils/zodValidation.js";
import { SingupAuth } from "../controllers/OtpController.js";
import { Otp } from "../models/Otp.js";
import { User } from "../models/Users.js";

const validBasePayload = {
  fullname: "Valid Runner",
  email: "runner@example.com",
  gender: "female",
  password: "ValidPassword123!",
  phone: "9876543210",
};

const createMockResponse = () => ({
  statusCode: 200,
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

test("DOB validation: accepts valid leap-year date 2000-02-29", () => {
  const result = signupVal.safeParse({
    ...validBasePayload,
    DOB: "2000-02-29",
  });
  assert.equal(result.success, true);
  assert.equal(result.data.DOB, "2000-02-29");
});

test("DOB validation: rejects invalid leap-year date 2001-02-29", () => {
  const result = signupVal.safeParse({
    ...validBasePayload,
    DOB: "2001-02-29",
  });
  assert.equal(result.success, false);
  const formatted = result.error.format();
  assert.deepEqual(formatted.DOB._errors, [
    "Date provided must be a valid calendar date",
  ]);
});

test("DOB validation: rejects nonexistent calendar date 2000-02-31", () => {
  const result = signupVal.safeParse({
    ...validBasePayload,
    DOB: "2000-02-31",
  });
  assert.equal(result.success, false);
  const formatted = result.error.format();
  assert.deepEqual(formatted.DOB._errors, [
    "Date provided must be a valid calendar date",
  ]);
});

test("DOB validation: rejects nonexistent calendar date 2000-04-31", () => {
  const result = signupVal.safeParse({
    ...validBasePayload,
    DOB: "2000-04-31",
  });
  assert.equal(result.success, false);
  const formatted = result.error.format();
  assert.deepEqual(formatted.DOB._errors, [
    "Date provided must be a valid calendar date",
  ]);
});

test("DOB validation: accepts valid calendar date 2000-04-30", () => {
  const result = signupVal.safeParse({
    ...validBasePayload,
    DOB: "2000-04-30",
  });
  assert.equal(result.success, true);
  assert.equal(result.data.DOB, "2000-04-30");
});

test("DOB validation: rejects non-date string 'not-a-date'", () => {
  const result = signupVal.safeParse({
    ...validBasePayload,
    DOB: "not-a-date",
  });
  assert.equal(result.success, false);
  const formatted = result.error.format();
  assert.deepEqual(formatted.DOB._errors, [
    "Date provided must be in YYYY-MM-DD format",
  ]);
});

test("DOB validation: rejects DD/MM/YYYY format '29/02/2000'", () => {
  const result = signupVal.safeParse({
    ...validBasePayload,
    DOB: "29/02/2000",
  });
  assert.equal(result.success, false);
  const formatted = result.error.format();
  assert.deepEqual(formatted.DOB._errors, [
    "Date provided must be in YYYY-MM-DD format",
  ]);
});

test("DOB validation: rejects MM-DD-YYYY format '02-29-2000'", () => {
  const result = signupVal.safeParse({
    ...validBasePayload,
    DOB: "02-29-2000",
  });
  assert.equal(result.success, false);
  const formatted = result.error.format();
  assert.deepEqual(formatted.DOB._errors, [
    "Date provided must be in YYYY-MM-DD format",
  ]);
});

test("DOB validation: rejects YYYY/MM/DD format '2000/02/29'", () => {
  const result = signupVal.safeParse({
    ...validBasePayload,
    DOB: "2000/02/29",
  });
  assert.equal(result.success, false);
  const formatted = result.error.format();
  assert.deepEqual(formatted.DOB._errors, [
    "Date provided must be in YYYY-MM-DD format",
  ]);
});

test("DOB validation: rejects today's date in IST", () => {
  const istToday = getIstTodayDateString();
  const result = signupVal.safeParse({
    ...validBasePayload,
    DOB: istToday,
  });
  assert.equal(result.success, false);
  const formatted = result.error.format();
  assert.deepEqual(formatted.DOB._errors, [
    "Date of Birth should not be today or later",
  ]);
});

test("DOB validation: rejects tomorrow's date in IST", () => {
  const istTomorrow = getIstTodayDateString(
    new Date(Date.now() + 24 * 60 * 60 * 1000),
  );
  const result = signupVal.safeParse({
    ...validBasePayload,
    DOB: istTomorrow,
  });
  assert.equal(result.success, false);
  const formatted = result.error.format();
  assert.deepEqual(formatted.DOB._errors, [
    "Date of Birth should not be today or later",
  ]);
});

test("DOB validation: accepts a valid date in the past", () => {
  const result = signupVal.safeParse({
    ...validBasePayload,
    DOB: "1995-10-25",
  });
  assert.equal(result.success, true);
  assert.equal(result.data.DOB, "1995-10-25");
});

test("DOB validation: rejects missing DOB", () => {
  const payload = { ...validBasePayload };
  delete payload.DOB;
  const result = signupVal.safeParse(payload);
  assert.equal(result.success, false);
  const formatted = result.error.format();
  assert.ok(formatted.DOB._errors.length > 0);
});

test("DOB validation: rejects non-string DOB values", () => {
  for (const invalidValue of [12345678, null, true, {}]) {
    const result = signupVal.safeParse({
      ...validBasePayload,
      DOB: invalidValue,
    });
    assert.equal(result.success, false);
    const formatted = result.error.format();
    assert.ok(formatted.DOB._errors.length > 0);
  }
});

test("DOB validation with controlled clock: verifies deterministic past boundary", () => {
  // Deterministic reference clock: 2025-06-15T00:00:00Z -> IST is 2025-06-15
  const referenceTime = new Date("2025-06-15T00:00:00.000Z");
  const schema = createSignupSchema(() => referenceTime);

  // Past date relative to reference clock
  const pastResult = schema.safeParse({
    ...validBasePayload,
    DOB: "2025-06-14",
  });
  assert.equal(pastResult.success, true);

  // Same day relative to reference clock in IST
  const todayResult = schema.safeParse({
    ...validBasePayload,
    DOB: "2025-06-15",
  });
  assert.equal(todayResult.success, false);
  assert.deepEqual(todayResult.error.format().DOB._errors, [
    "Date of Birth should not be today or later",
  ]);

  // Future date relative to reference clock
  const futureResult = schema.safeParse({
    ...validBasePayload,
    DOB: "2025-06-16",
  });
  assert.equal(futureResult.success, false);
  assert.deepEqual(futureResult.error.format().DOB._errors, [
    "Date of Birth should not be today or later",
  ]);
});

test("DOB validation: getIstTodayDateString respects Asia/Kolkata offset", () => {
  // At 2026-03-31 20:00:00 UTC, IST (+5:30) is 2026-04-01 01:30:00
  const utcLate = new Date("2026-03-31T20:00:00.000Z");
  assert.equal(getIstTodayDateString(utcLate), "2026-04-01");

  // At 2026-04-01 02:00:00 UTC, IST (+5:30) is 2026-04-01 07:30:00
  const utcEarly = new Date("2026-04-01T02:00:00.000Z");
  assert.equal(getIstTodayDateString(utcEarly), "2026-04-01");
});

test("SingupAuth controller: returns HTTP 400 on invalid DOB without creating user", async () => {
  let userCreated = false;
  let sessionDeleted = false;

  mock.method(Otp, "findOne", async () => ({
    email: "testrunner@example.com",
    verified: true,
    deleteOne: async () => {
      sessionDeleted = true;
    },
  }));

  mock.method(User, "create", async () => {
    userCreated = true;
  });

  try {
    const req = {
      body: {
        sessionId: "mock-session-123",
        fullname: "AthLead Runner",
        gender: "male",
        password: "ValidPassword123!",
        DOB: "2000-02-31", // Nonexistent date
      },
    };
    const res = createMockResponse();

    await SingupAuth(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body.errors.DOB._errors, [
      "Date provided must be a valid calendar date",
    ]);
    assert.equal(
      userCreated,
      false,
      "User must not be created on validation failure",
    );
    assert.equal(
      sessionDeleted,
      false,
      "OTP session must not be deleted on validation failure",
    );
  } finally {
    mock.reset();
  }
});

test("SingupAuth controller: succeeds and creates user with valid DOB", async () => {
  let createdUserPayload = null;
  let sessionDeleted = false;

  mock.method(Otp, "findOne", async () => ({
    email: "testrunner@example.com",
    verified: true,
    deleteOne: async () => {
      sessionDeleted = true;
    },
  }));

  mock.method(User, "findOne", async () => null);

  mock.method(User, "create", async (payload) => {
    createdUserPayload = payload;
    return payload;
  });

  try {
    const req = {
      body: {
        sessionId: "mock-session-123",
        fullname: "AthLead Runner",
        gender: "male",
        password: "ValidPassword123!",
        DOB: "2000-02-29", // Valid leap-year date
      },
    };
    const res = createMockResponse();

    await SingupAuth(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, "Sign Up Successful");
    assert.equal(createdUserPayload.DOB, "2000-02-29");
    assert.equal(createdUserPayload.email, "testrunner@example.com");
    assert.equal(
      sessionDeleted,
      true,
      "OTP session must be consumed on success",
    );
  } finally {
    mock.reset();
  }
});
