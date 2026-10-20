import assert from "node:assert/strict";
import test from "node:test";
import { ZodError, z } from "zod";
import { errorHandler } from "../middleware/errorHandler.js";
import {
  requireRole,
  requireAdmin,
  wrapAsync,
  validateEvent,
} from "../middleware/middleware.js";

function createMockRes() {
  return {
    statusCode: 200,
    headersSent: false,
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
}

// ---------------------------------------------------------------------------
// Error Handler Middleware Tests
// ---------------------------------------------------------------------------

test("errorHandler delegates to next(err) if headers have already been sent", () => {
  const err = new Error("Late failure");
  const req = {};
  const res = createMockRes();
  res.headersSent = true;
  let forwardedError = null;

  errorHandler(err, req, res, (e) => {
    forwardedError = e;
  });

  assert.equal(forwardedError, err);
  assert.equal(res.body, null);
});

test("errorHandler handles null or undefined err with generic 500 message", () => {
  const prevEnv = process.env.NODE_ENV;
  const originalError = console.error;
  console.error = () => {};
  process.env.NODE_ENV = "production";
  try {
    const req = {};
    const res = createMockRes();

    errorHandler(null, req, res, () => {});

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, {
      success: false,
      message: "Internal server error",
    });
  } finally {
    process.env.NODE_ENV = prevEnv;
    console.error = originalError;
  }
});

test("errorHandler maps ZodError to HTTP 400 with path and message formatting", () => {
  const schema = z.object({
    username: z.string().min(3, "Too short"),
    age: z.number().int().positive("Must be positive"),
  });

  let zodErr;
  try {
    schema.parse({ username: "a", age: -5 });
  } catch (e) {
    zodErr = e;
  }

  assert.ok(zodErr instanceof ZodError);

  const req = {};
  const res = createMockRes();

  errorHandler(zodErr, req, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, "Validation failed");
  assert.ok(Array.isArray(res.body.errors));
  assert.equal(res.body.errors.length, 2);

  const usernameIssue = res.body.errors.find((e) => e.path === "username");
  assert.equal(usernameIssue?.message, "Too short");

  const ageIssue = res.body.errors.find((e) => e.path === "age");
  assert.equal(ageIssue?.message, "Must be positive");
});

test("errorHandler maps MulterError to HTTP 400", () => {
  const err = new Error("File size exceeds 5MB limit");
  err.name = "MulterError";

  const req = {};
  const res = createMockRes();

  errorHandler(err, req, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    success: false,
    message: "File size exceeds 5MB limit",
  });
});

test("errorHandler maps TokenExpiredError to HTTP 401", () => {
  const err = new Error("jwt expired");
  err.name = "TokenExpiredError";

  const req = {};
  const res = createMockRes();

  errorHandler(err, req, res, () => {});

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, {
    success: false,
    message: "Token expired",
  });
});

test("errorHandler maps JsonWebTokenError and NotBeforeError to HTTP 401", () => {
  for (const errorName of ["JsonWebTokenError", "NotBeforeError"]) {
    const err = new Error("token invalid");
    err.name = errorName;

    const req = {};
    const res = createMockRes();

    errorHandler(err, req, res, () => {});

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, {
      success: false,
      message: "Invalid token",
    });
  }
});

test("errorHandler maps Mongoose ValidationError to HTTP 400 with field errors", () => {
  const err = new Error("Validation failed");
  err.name = "ValidationError";
  err.errors = {
    email: { path: "email", message: "Email is required" },
    sport: { path: "sport", message: "Sport must be valid" },
  };

  const req = {};
  const res = createMockRes();

  errorHandler(err, req, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, "Validation failed");
  assert.deepEqual(res.body.errors, [
    { path: "email", message: "Email is required" },
    { path: "sport", message: "Sport must be valid" },
  ]);
});

test("errorHandler maps Mongoose CastError to HTTP 400 with path description", () => {
  const err = new Error("Cast to ObjectId failed");
  err.name = "CastError";
  err.path = "_id";

  const req = {};
  const res = createMockRes();

  errorHandler(err, req, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    success: false,
    message: "Invalid value for _id",
  });
});

test("errorHandler maps MongoDB duplicate key (code 11000) to HTTP 409", () => {
  const errWithField = new Error("E11000 duplicate key");
  errWithField.code = 11000;
  errWithField.keyPattern = { email: 1 };

  const res1 = createMockRes();
  errorHandler(errWithField, {}, res1, () => {});

  assert.equal(res1.statusCode, 409);
  assert.deepEqual(res1.body, {
    success: false,
    message: "email already exists",
  });

  const errWithoutField = new Error("E11000 duplicate key");
  errWithoutField.code = 11000;

  const res2 = createMockRes();
  errorHandler(errWithoutField, {}, res2, () => {});

  assert.equal(res2.statusCode, 409);
  assert.deepEqual(res2.body, {
    success: false,
    message: "Duplicate value",
  });
});

test("errorHandler maps body-parser entity.parse.failed to HTTP 400 and entity.too.large to HTTP 413", () => {
  const parseErr = new Error("Invalid JSON");
  parseErr.type = "entity.parse.failed";

  const res1 = createMockRes();
  errorHandler(parseErr, {}, res1, () => {});
  assert.equal(res1.statusCode, 400);
  assert.deepEqual(res1.body, {
    success: false,
    message: "Malformed request body",
  });

  const sizeErr = new Error("Request entity too large");
  sizeErr.type = "entity.too.large";

  const res2 = createMockRes();
  errorHandler(sizeErr, {}, res2, () => {});
  assert.equal(res2.statusCode, 413);
  assert.deepEqual(res2.body, {
    success: false,
    message: "Request body too large",
  });
});

test("errorHandler respects custom candidate status codes in 4xx range", () => {
  const notFound = new Error("Event not found");
  notFound.status = 404;

  const res1 = createMockRes();
  errorHandler(notFound, {}, res1, () => {});
  assert.equal(res1.statusCode, 404);
  assert.deepEqual(res1.body, {
    success: false,
    message: "Event not found",
  });

  const forbidden = new Error("Forbidden access");
  forbidden.statusCode = 403;

  const res2 = createMockRes();
  errorHandler(forbidden, {}, res2, () => {});
  assert.equal(res2.statusCode, 403);
  assert.deepEqual(res2.body, {
    success: false,
    message: "Forbidden access",
  });
});

test("errorHandler preserves custom 5xx status codes and masks messages in production", () => {
  const prevEnv = process.env.NODE_ENV;
  const originalError = console.error;
  console.error = () => {};
  try {
    // status field variant.
    process.env.NODE_ENV = "development";
    const gatewayErr = new Error("Upstream unavailable");
    gatewayErr.status = 502;

    const res1 = createMockRes();
    errorHandler(gatewayErr, {}, res1, () => {});
    assert.equal(res1.statusCode, 502);
    assert.equal(res1.body.message, "Upstream unavailable");

    // statusCode field variant with masked production message.
    process.env.NODE_ENV = "production";
    const unavailableErr = new Error("Sensitive upstream diagnostic");
    unavailableErr.statusCode = 503;

    const res2 = createMockRes();
    errorHandler(unavailableErr, {}, res2, () => {});
    assert.equal(res2.statusCode, 503);
    assert.deepEqual(res2.body, {
      success: false,
      message: "Internal server error",
    });
    assert.equal(res2.body.stack, undefined);
  } finally {
    process.env.NODE_ENV = prevEnv;
    console.error = originalError;
  }
});

test("errorHandler hides error message and stack in production for 500 errors", () => {
  const prevEnv = process.env.NODE_ENV;
  const originalError = console.error;
  console.error = () => {};
  process.env.NODE_ENV = "production";
  try {
    const internalErr = new Error("Database connection timed out");

    const res = createMockRes();
    errorHandler(internalErr, {}, res, () => {});

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, {
      success: false,
      message: "Internal server error",
    });
    assert.equal(res.body.stack, undefined);
  } finally {
    process.env.NODE_ENV = prevEnv;
    console.error = originalError;
  }
});

test("errorHandler includes error message and stack in development for 500 errors", () => {
  const prevEnv = process.env.NODE_ENV;
  const originalError = console.error;
  console.error = () => {};
  process.env.NODE_ENV = "development";
  try {
    const internalErr = new Error("Sensitive dev diagnostic");

    const res = createMockRes();
    errorHandler(internalErr, {}, res, () => {});

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Sensitive dev diagnostic");
    assert.ok(typeof res.body.stack === "string");
  } finally {
    process.env.NODE_ENV = prevEnv;
    console.error = originalError;
  }
});

// ---------------------------------------------------------------------------
// Role and Middleware Helper Tests
// ---------------------------------------------------------------------------

test("requireRole allows request with matching role", () => {
  const middleware = requireRole("ADMIN", "COACH");
  const req = { user: { role: "ADMIN" } };
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.body, null);
});

test("requireRole rejects unauthenticated user with HTTP 403", () => {
  const middleware = requireRole("ADMIN");
  const req = {};
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, {
    success: false,
    message: "You are not authorized to perform this action",
  });
});

test("requireRole rejects user with non-matching role with HTTP 403", () => {
  const middleware = requireRole("ADMIN");
  const req = { user: { role: "ATHLETE" } };
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, {
    success: false,
    message: "You are not authorized to perform this action",
  });
});

test("requireAdmin only authorizes ADMIN role", () => {
  const reqAdmin = { user: { role: "ADMIN" } };
  const resAdmin = createMockRes();
  let adminPassed = false;
  requireAdmin(reqAdmin, resAdmin, () => {
    adminPassed = true;
  });
  assert.equal(adminPassed, true);

  const reqUser = { user: { role: "USER" } };
  const resUser = createMockRes();
  let userPassed = false;
  requireAdmin(reqUser, resUser, () => {
    userPassed = true;
  });
  assert.equal(userPassed, false);
  assert.equal(resUser.statusCode, 403);
});

test("wrapAsync forwards promise rejections to next(err)", async () => {
  const expectedErr = new Error("Async failure");
  const asyncFn = async () => {
    throw expectedErr;
  };

  const wrapped = wrapAsync(asyncFn);
  const req = {};
  const res = createMockRes();
  let caughtError = null;

  wrapped(req, res, (err) => {
    caughtError = err;
  });

  await new Promise((resolve) => setTimeout(resolve, 10));

  assert.equal(caughtError, expectedErr);
});

test("validateEvent parses req.body.data when present and passes validated data", () => {
  const schema = z.object({
    title: z.string(),
    capacity: z.number().int().positive(),
  });

  const middleware = validateEvent(schema);
  const req = {
    body: {
      data: { title: "Marathon 2026", capacity: 500 },
    },
  };
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.validatedData, {
    title: "Marathon 2026",
    capacity: 500,
  });
});

test("validateEvent parses req.body directly when req.body.data is undefined", () => {
  const schema = z.object({
    sport: z.string(),
  });

  const middleware = validateEvent(schema);
  const req = {
    body: { sport: "Swimming" },
  };
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.validatedData, { sport: "Swimming" });
});

test("validateEvent forwards ZodError to next(err) on schema mismatch", () => {
  const schema = z.object({
    score: z.number(),
  });

  const middleware = validateEvent(schema);
  const req = {
    body: { score: "not-a-number" },
  };
  const res = createMockRes();
  let forwardedError = null;

  middleware(req, res, (err) => {
    forwardedError = err;
  });

  assert.ok(forwardedError instanceof ZodError);
});
