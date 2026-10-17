import assert from "node:assert/strict";
import test, { mock } from "node:test";
import bcrypt from "bcrypt";
import { User } from "../models/Users.js";
import { Otp } from "../models/Otp.js";
import { LoginAuth, getUser } from "../controllers/authController.js";
import { sendOtp, verifyOtp, SingupAuth } from "../controllers/OtpController.js";

const createResponse = () => ({
  statusCode: 200,
  body: null,
  cookies: {},
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
  cookie(name, value, options) {
    this.cookies[name] = { value, options };
    return this;
  },
});

test("Issue #143: LoginAuth with non-existent email returns HTTP 401 instead of 200", async () => {
  mock.method(User, "findOne", () => ({
    select: () => null,
  }));

  try {
    const req = {
      body: {
        email: "nonexistent@example.com",
        password: "ValidPassword123!",
      },
    };
    const res = createResponse();

    await LoginAuth(req, res);

    assert.equal(res.statusCode, 401, "Expected HTTP 401 for non-existent user");
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Invalid email or password");
  } finally {
    mock.reset();
  }
});

test("Issue #143: LoginAuth with wrong password returns HTTP 401 instead of 200", async () => {
  mock.method(User, "findOne", () => ({
    select: () => ({
      email: "runner@example.com",
      password: "hashed_password",
    }),
  }));

  mock.method(bcrypt, "compareSync", () => false);

  try {
    const req = {
      body: {
        email: "runner@example.com",
        password: "WrongPassword123!",
      },
    };
    const res = createResponse();

    await LoginAuth(req, res);

    assert.equal(res.statusCode, 401, "Expected HTTP 401 for wrong password");
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Invalid email or password");
  } finally {
    mock.reset();
  }
});

test("Issue #143: LoginAuth with invalid request data returns HTTP 400", async () => {
  const req = {
    body: {
      email: "not-an-email",
      password: "",
    },
  };
  const res = createResponse();

  await LoginAuth(req, res);

  assert.equal(res.statusCode, 400, "Expected HTTP 400 for invalid body");
  assert.ok(res.body.errors, "Expected Zod formatted errors in response");
});

test("Issue #143: LoginAuth with correct credentials returns HTTP 200 and auth tokens", async () => {
  const hashedPassword = bcrypt.hashSync("ValidPassword123!", 10);
  mock.method(User, "findOne", () => ({
    select: () => ({
      email: "runner@example.com",
      password: hashedPassword,
      generateRefreshToken: () => "refresh-token-xyz",
      generateAccessToken: () => "access-token-abc",
    }),
  }));

  try {
    const req = {
      body: {
        email: "runner@example.com",
        password: "ValidPassword123!",
      },
    };
    const res = createResponse();

    await LoginAuth(req, res);

    assert.equal(res.statusCode, 200, "Expected HTTP 200 on successful login");
    assert.equal(res.body.success, true);
    assert.equal(res.body.accessToken, "access-token-abc");
    assert.equal(res.cookies.refreshToken.value, "refresh-token-xyz");
  } finally {
    mock.reset();
  }
});

test("Issue #143: LoginAuth unexpected database error returns HTTP 500 instead of 200", async () => {
  mock.method(User, "findOne", () => ({
    select: () => {
      throw new Error("Database timeout");
    },
  }));

  try {
    const req = {
      body: {
        email: "runner@example.com",
        password: "ValidPassword123!",
      },
    };
    const res = createResponse();

    await LoginAuth(req, res);

    assert.equal(res.statusCode, 500, "Expected HTTP 500 for server error");
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Login failed. Please try again.");
  } finally {
    mock.reset();
  }
});

test("Issue #143: getUser when user is not found returns HTTP 404 instead of 200", async () => {
  mock.method(User, "findOne", () => ({
    select: () => null,
  }));

  try {
    const req = { user: { _id: "missing-user-id" } };
    const res = createResponse();

    await getUser(req, res);

    assert.equal(res.statusCode, 404, "Expected HTTP 404 for missing user");
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "User not found");
  } finally {
    mock.reset();
  }
});

test("Issue #143: getUser when user is found returns HTTP 200 with user data", async () => {
  mock.method(User, "findOne", () => ({
    select: () => ({ _id: "user-123", fullname: "Athlete Runner" }),
  }));

  try {
    const req = { user: { _id: "user-123" } };
    const res = createResponse();

    await getUser(req, res);

    assert.equal(res.statusCode, 200, "Expected HTTP 200 for found user");
    assert.equal(res.body.success, true);
    assert.deepEqual(res.body.user, {
      _id: "user-123",
      fullname: "Athlete Runner",
    });
  } finally {
    mock.reset();
  }
});

test("Issue #143: sendOtp for already registered user returns HTTP 409 duplicate resource", async () => {
  mock.method(User, "findOne", async () => ({
    _id: "existing-user",
    email: "registered@example.com",
  }));

  try {
    const req = { body: { email: "registered@example.com" } };
    const res = createResponse();

    await sendOtp(req, res);

    assert.equal(res.statusCode, 409, "Expected HTTP 409 for existing user email");
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Email already registered");
  } finally {
    mock.reset();
  }
});

test("Issue #143: sendOtp with missing or invalid email returns HTTP 400", async () => {
  const req = { body: {} };
  const res = createResponse();

  await sendOtp(req, res);

  assert.equal(res.statusCode, 400, "Expected HTTP 400 for missing email");
  assert.equal(res.body.success, false);
});

test("Issue #143: verifyOtp with invalid code returns HTTP 401 instead of 400", async () => {
  mock.method(Otp, "findOne", async () => ({
    _id: "otp-doc-123",
    sessionId: "valid-session-id",
    otpHash: "hash-xyz",
    attempts: 0,
    expiresAt: new Date(Date.now() + 60000),
    verifyOtp: () => false,
  }));

  mock.method(Otp, "findOneAndUpdate", async () => ({
    attempts: 1,
  }));

  try {
    const req = { body: { sessionId: "valid-session-id", otp: "000000" } };
    const res = createResponse();

    await verifyOtp(req, res);

    assert.equal(res.statusCode, 401, "Expected HTTP 401 for invalid OTP code");
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes("Invalid OTP"));
  } finally {
    mock.reset();
  }
});

test("Issue #143: verifyOtp with missing parameters returns HTTP 400", async () => {
  const req = { body: { sessionId: "only-session" } };
  const res = createResponse();

  await verifyOtp(req, res);

  assert.equal(res.statusCode, 400, "Expected HTTP 400 for missing parameters");
  assert.equal(res.body.success, false);
});

test("Issue #143: SingupAuth with existing user email returns HTTP 409 instead of 400", async () => {
  mock.method(Otp, "findOne", async () => ({
    sessionId: "valid-session-id",
    email: "existing@example.com",
    verified: true,
    deleteOne: async () => {},
  }));

  mock.method(User, "findOne", async () => ({
    _id: "existing-user",
    email: "existing@example.com",
  }));

  try {
    const req = {
      body: {
        sessionId: "valid-session-id",
        fullname: "John Doe",
        phone: "9876543210",
        gender: "male",
        password: "ValidPassword123!",
        DOB: "2000-01-01",
      },
    };
    const res = createResponse();

    await SingupAuth(req, res);

    assert.equal(res.statusCode, 409, "Expected HTTP 409 for duplicate user on signup");
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "User already exists");
  } finally {
    mock.reset();
  }
});

test("Issue #143: SingupAuth with unverified session returns HTTP 403", async () => {
  mock.method(Otp, "findOne", async () => null);

  try {
    const req = {
      body: {
        sessionId: "unverified-session-id",
        fullname: "John Doe",
        phone: "9876543210",
        gender: "male",
        password: "ValidPassword123!",
        DOB: "2000-01-01",
      },
    };
    const res = createResponse();

    await SingupAuth(req, res);

    assert.equal(res.statusCode, 403, "Expected HTTP 403 for unverified session");
    assert.equal(res.body.success, false);
    assert.equal(
      res.body.message,
      "Email not verified. Please complete OTP verification first.",
    );
  } finally {
    mock.reset();
  }
});

test("Issue #143: SingupAuth with missing sessionId returns HTTP 400", async () => {
  const req = { body: { fullname: "No Session" } };
  const res = createResponse();

  await SingupAuth(req, res);

  assert.equal(res.statusCode, 400, "Expected HTTP 400 for missing sessionId");
  assert.equal(res.body.success, false);
});
