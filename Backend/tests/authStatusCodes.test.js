import test, { afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { hashSync } from "bcrypt";
import { User } from "../models/Users.js";
import { LoginAuth, getUser } from "../controllers/authController.js";
import { sendOtp } from "../controllers/OtpController.js";

// Minimal stand-in for Express's res. Like Express, the status defaults to 200.
const createRes = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
  cookie() {
    return this;
  },
});

// LoginAuth and getUser call User.findOne(...).select(...), so the mock
// has to return an object with a select() method.
const mockFindOneWithSelect = (result) =>
  mock.method(User, "findOne", () => ({ select: async () => result }));

afterEach(() => {
  mock.restoreAll();
});

test("login returns 400 for an invalid request body", async () => {
  const res = createRes();

  await LoginAuth({ body: { email: "not-an-email" } }, res);

  assert.equal(res.statusCode, 400);
});

test("login returns 401 for an unknown email", async () => {
  mockFindOneWithSelect(null);
  const res = createRes();

  await LoginAuth(
    { body: { email: "nobody@example.com", password: "WrongPassword123!" } },
    res,
  );

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
});

test("login returns the same 401 and message for a wrong password", async () => {
  const unknownRes = createRes();
  mockFindOneWithSelect(null);
  await LoginAuth(
    { body: { email: "nobody@example.com", password: "WrongPassword123!" } },
    unknownRes,
  );
  mock.restoreAll();

  const wrongPasswordRes = createRes();
  mockFindOneWithSelect({ password: hashSync("CorrectPassword1!", 4) });
  await LoginAuth(
    { body: { email: "real@example.com", password: "WrongPassword123!" } },
    wrongPasswordRes,
  );

  assert.equal(wrongPasswordRes.statusCode, 401);
  assert.deepEqual(wrongPasswordRes.body, unknownRes.body);
});

test("login returns 500 without leaking the internal error", async () => {
  mock.method(console, "error", () => {});
  mock.method(User, "findOne", () => ({
    select: async () => {
      throw new Error("secret internal detail");
    },
  }));
  const res = createRes();

  await LoginAuth(
    { body: { email: "nobody@example.com", password: "WrongPassword123!" } },
    res,
  );

  assert.equal(res.statusCode, 500);
  assert.ok(!JSON.stringify(res.body).includes("secret internal detail"));
});

test("getUser returns 404 when the user does not exist", async () => {
  mockFindOneWithSelect(null);
  const res = createRes();

  await getUser({ user: { _id: "507f1f77bcf86cd799439011" } }, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.success, false);
});

test("sendOtp returns 409 when the email is already registered", async () => {
  mock.method(User, "findOne", async () => ({ email: "taken@example.com" }));
  const res = createRes();

  await sendOtp({ body: { email: "taken@example.com" } }, res);

  assert.equal(res.statusCode, 409);
  assert.equal(res.body.message, "Email already registered");
});
