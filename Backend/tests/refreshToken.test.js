import assert from "node:assert/strict";
import test, { mock } from "node:test";
import crypto from "crypto";
import { User } from "../models/Users.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { LoginAuth, refesh, logout } from "../controllers/authController.js";
import {
  up,
  down,
} from "../migrations/20261016220000-add-refresh-token-indexes.js";

const createResponse = () => {
  const res = {
    statusCode: 200,
    body: null,
    cookies: {},
    clearedCookies: [],
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    cookie(name, val, options) {
      this.cookies[name] = { val, options };
      return this;
    },
    clearCookie(name) {
      this.clearedCookies.push(name);
      delete this.cookies[name];
      return this;
    },
  };
  return res;
};

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

test("LoginAuth generates and persists hashed refresh token with unique family", async () => {
  const testUserId = "507f1f77bcf86cd799439011";
  process.env.JWT_SECRET = "test-jwt-secret";
  process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";

  const { hashSync } = await import("bcrypt");
  const fakeUser = new User({
    _id: testUserId,
    fullname: "Test Runner",
    email: "runner@athlead.com",
    gender: "Other",
    password: hashSync("ValidPassword123!", 10),
  });

  mock.method(User, "findOne", () => ({
    select: () => fakeUser,
  }));

  let createdTokenRecord = null;
  mock.method(RefreshToken, "create", async (payload) => {
    createdTokenRecord = payload;
    return payload;
  });

  try {
    const req = {
      body: {
        email: "runner@athlead.com",
        password: "ValidPassword123!",
      },
    };
    const res = createResponse();

    await LoginAuth(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.accessToken, "Should return access token");
    assert.ok(res.cookies.refreshToken, "Should set refreshToken cookie");

    const cookieToken = res.cookies.refreshToken.val;
    assert.ok(createdTokenRecord, "RefreshToken record must be created in DB");
    assert.equal(createdTokenRecord.tokenHash, hashToken(cookieToken));
    assert.equal(createdTokenRecord.revoked, false);
    assert.ok(createdTokenRecord.family, "Family ID must be present");
  } finally {
    mock.reset();
  }
});

test("refesh rejects with 401 when refreshToken cookie is missing", async () => {
  const req = { cookies: {} };
  const res = createResponse();

  await refesh(req, res);

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, "token not present");
});

test("refesh rejects with 401 when refreshToken is invalid or tampered", async () => {
  process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";
  const req = {
    cookies: {
      refreshToken: "malformed.invalid.token",
    },
  };
  const res = createResponse();

  await refesh(req, res);

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, "invalid token");
});

test("refesh rejects and revokes family when a revoked token is reused (reuse detection)", async () => {
  const testUserId = "507f1f77bcf86cd799439011";
  process.env.JWT_SECRET = "test-jwt-secret";
  process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";

  const fakeUser = new User({
    _id: testUserId,
    fullname: "Test Runner",
    email: "runner@athlead.com",
    gender: "Other",
  });

  const familyId = "family-1234";
  const revokedToken = fakeUser.generateRefreshToken(familyId);
  const tokenHash = hashToken(revokedToken);

  mock.method(RefreshToken, "findOne", async ({ tokenHash: queryHash }) => {
    if (queryHash === tokenHash) {
      return {
        _id: "token-doc-1",
        user: testUserId,
        tokenHash,
        family: familyId,
        revoked: true, // Already revoked!
      };
    }
    return null;
  });

  let revokedFamilies = [];
  mock.method(RefreshToken, "updateMany", async (query, update) => {
    if (update.revoked === true) {
      revokedFamilies.push(query.family);
    }
  });

  try {
    const req = {
      cookies: { refreshToken: revokedToken },
    };
    const res = createResponse();

    await refesh(req, res);

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Invalid or revoked refresh token");
    assert.ok(
      revokedFamilies.includes(familyId),
      "Family must be invalidated upon reuse",
    );
    assert.ok(
      res.clearedCookies.includes("refreshToken"),
      "Cookie must be cleared",
    );
  } finally {
    mock.reset();
  }
});

test("refesh rotates valid token, invalidates predecessor, and returns new tokens", async () => {
  const testUserId = "507f1f77bcf86cd799439011";
  process.env.JWT_SECRET = "test-jwt-secret";
  process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";

  const fakeUser = new User({
    _id: testUserId,
    fullname: "Test Runner",
    email: "runner@athlead.com",
    gender: "Other",
  });

  const familyId = "family-rotate-123";
  const validRefreshToken = fakeUser.generateRefreshToken(familyId);
  const tokenHash = hashToken(validRefreshToken);

  mock.method(RefreshToken, "findOne", async () => ({
    _id: "token-doc-2",
    user: testUserId,
    tokenHash,
    family: familyId,
    revoked: false,
  }));

  mock.method(RefreshToken, "findOneAndUpdate", async () => ({
    _id: "token-doc-2",
    revoked: true,
  }));

  mock.method(User, "findOne", async () => fakeUser);

  let newlyCreatedToken = null;
  mock.method(RefreshToken, "create", async (payload) => {
    newlyCreatedToken = payload;
    return payload;
  });

  try {
    const req = {
      cookies: { refreshToken: validRefreshToken },
    };
    const res = createResponse();

    await refesh(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.accessToken, "Must issue new access token");
    assert.ok(res.cookies.refreshToken, "Must set new refresh token cookie");
    assert.notEqual(
      res.cookies.refreshToken.val,
      validRefreshToken,
      "Must rotate to a new refresh token",
    );
    assert.ok(
      newlyCreatedToken,
      "Must persist new rotated refresh token in DB",
    );
    assert.equal(
      newlyCreatedToken.family,
      familyId,
      "Rotated token must remain in same family",
    );
    assert.equal(newlyCreatedToken.revoked, false);
  } finally {
    mock.reset();
  }
});

test("logout revokes refresh-token family and clears cookies", async () => {
  const testToken = "valid.jwt.refresh.token";
  const tokenHash = hashToken(testToken);
  const familyId = "logout-family-123";

  mock.method(RefreshToken, "findOne", async () => ({
    tokenHash,
    family: familyId,
  }));

  let revokedFamilies = [];
  mock.method(RefreshToken, "updateMany", async (query, update) => {
    if (update.revoked === true) {
      revokedFamilies.push(query.family);
    }
  });

  try {
    const req = {
      cookies: { refreshToken: testToken },
      user: { _id: "user-123" },
    };
    const res = createResponse();

    await logout(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, "logged out");
    assert.ok(
      revokedFamilies.includes(familyId),
      "Should revoke the token family",
    );
    assert.ok(
      res.clearedCookies.includes("accessToken"),
      "Must clear accessToken",
    );
    assert.ok(
      res.clearedCookies.includes("refreshToken"),
      "Must clear refreshToken",
    );
  } finally {
    mock.reset();
  }
});

test("logout revokes tokens for unauthenticated user when refreshToken cookie is present", async () => {
  const testToken = "unauth.refresh.token";
  const tokenHash = hashToken(testToken);
  const familyId = "unauth-family-456";

  mock.method(RefreshToken, "findOne", async () => ({
    tokenHash,
    family: familyId,
  }));

  let revokedFamilies = [];
  mock.method(RefreshToken, "updateMany", async (query, update) => {
    if (update.revoked === true) {
      revokedFamilies.push(query.family);
    }
  });

  try {
    const req = {
      cookies: { refreshToken: testToken },
      user: undefined, // Unauthenticated!
    };
    const res = createResponse();

    await logout(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.ok(
      revokedFamilies.includes(familyId),
      "Must revoke family even without req.user",
    );
    assert.ok(res.clearedCookies.includes("refreshToken"));
  } finally {
    mock.reset();
  }
});

test("migration creates refreshtokens collection and expected indexes", async () => {
  let createdCollection = null;
  let createdIndexes = [];

  const mockDb = {
    listCollections: () => ({
      toArray: async () => [],
    }),
    createCollection: async (name) => {
      createdCollection = name;
    },
    collection: () => ({
      createIndex: async (spec, options) => {
        createdIndexes.push({ spec, options });
      },
      drop: async () => {},
    }),
  };

  await up(mockDb);

  assert.equal(createdCollection, "refreshtokens");
  assert.equal(createdIndexes.length, 4);
  assert.deepEqual(createdIndexes[0].spec, { tokenHash: 1 });
  assert.equal(createdIndexes[0].options.unique, true);
  assert.deepEqual(createdIndexes[1].spec, { family: 1 });
  assert.deepEqual(createdIndexes[2].spec, { user: 1 });
  assert.deepEqual(createdIndexes[3].spec, { expiresAt: 1 });
  assert.equal(createdIndexes[3].options.expireAfterSeconds, 0);

  // Test down
  let dropped = false;
  const mockDbForDown = {
    listCollections: () => ({
      toArray: async () => [{ name: "refreshtokens" }],
    }),
    collection: () => ({
      drop: async () => {
        dropped = true;
      },
    }),
  };

  await down(mockDbForDown);
  assert.equal(dropped, true);
});
