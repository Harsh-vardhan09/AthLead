import assert from "node:assert/strict";
import test from "node:test";
import Score from "../models/Score.js";
import { getRanking } from "../controllers/scoreController.js";

test("Score schema defines a compound index on score descending and _id ascending for deterministic sort", () => {
  const indexes = Score.schema.indexes();
  const scoreIndex = indexes.find(
    ([keys]) => keys.score === -1 && keys._id === 1,
  );
  assert.ok(
    scoreIndex,
    "Expected Score schema to have index on { score: -1, _id: 1 }",
  );
  assert.deepEqual(scoreIndex[0], { score: -1, _id: 1 });
});

test("Score schema preserves the TTL index on createdAt without alteration", () => {
  const indexes = Score.schema.indexes();
  const ttlIndex = indexes.find(([keys]) => keys.createdAt === 1);
  assert.ok(
    ttlIndex,
    "Expected Score schema to have TTL index on { createdAt: 1 }",
  );
  assert.equal(ttlIndex[1]?.expireAfterSeconds, 60 * 60 * 24 * 30);
});

test("Score schema has no duplicate or redundant index definitions", () => {
  const indexes = Score.schema.indexes();
  const keySignatures = indexes.map(([keys]) =>
    Object.entries(keys)
      .map(([k, v]) => `${k}:${v}`)
      .sort()
      .join(","),
  );

  const uniqueSignatures = new Set(keySignatures);
  assert.equal(
    keySignatures.length,
    uniqueSignatures.size,
    "Found duplicate index definitions on Score schema",
  );

  // Ensure score is not indexed multiple times under separate index definitions
  const scoreKeys = indexes.filter(([keys]) => "score" in keys);
  assert.equal(
    scoreKeys.length,
    1,
    "Expected exactly one index containing score",
  );

  // Ensure createdAt is not indexed multiple times
  const createdAtKeys = indexes.filter(([keys]) => "createdAt" in keys);
  assert.equal(
    createdAtKeys.length,
    1,
    "Expected exactly one index on createdAt",
  );
});

test("getRanking applies deterministic sort with _id tie-breaker and preserves dashboard contract", async () => {
  const originalFind = Score.find;
  const calls = {
    findFilter: null,
    sortArg: null,
    selectArg: null,
    populatePath: null,
    populateFields: null,
    leanCalled: false,
    execCalled: false,
  };

  const mockRankDocs = [
    {
      _id: "score-001",
      score: 95,
      user: {
        _id: "user-1",
        fullname: "Alice Runner",
        image: "https://example.com/alice.jpg",
        role: "USER",
        state: "Maharashtra",
        gender: "female",
      },
    },
    {
      _id: "score-002",
      score: 95, // Tied score with score-001; resolved deterministically by _id
      user: {
        _id: "user-2",
        fullname: "Bob Cyclist",
        image: "https://example.com/bob.jpg",
        role: "USER",
        state: "Karnataka",
        gender: "male",
      },
    },
    {
      _id: "score-003",
      score: 85,
      user: {
        _id: "user-3",
        fullname: "Charlie Swimmer",
        image: "https://example.com/charlie.jpg",
        role: "USER",
        state: "Delhi",
        gender: "male",
      },
    },
  ];

  const queryChain = {
    sort(arg) {
      calls.sortArg = arg;
      return this;
    },
    select(arg) {
      calls.selectArg = arg;
      return this;
    },
    populate(path, fields) {
      calls.populatePath = path;
      calls.populateFields = fields;
      return this;
    },
    lean() {
      calls.leanCalled = true;
      return this;
    },
    async exec() {
      calls.execCalled = true;
      return mockRankDocs;
    },
  };

  Score.find = (filter) => {
    calls.findFilter = filter;
    return queryChain;
  };

  const response = {
    statusCode: null,
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

  try {
    await getRanking({ query: {} }, response);

    // Verify optimized query chaining with deterministic tie-breaker
    assert.deepEqual(calls.findFilter, {});
    assert.deepEqual(calls.sortArg, { score: -1, _id: 1 });
    assert.equal(calls.selectArg, "user score");
    assert.equal(calls.populatePath, "user");
    assert.equal(calls.populateFields, "fullname image state gender");
    assert.equal(calls.leanCalled, true);
    assert.equal(calls.execCalled, true);

    // Verify response format preserving dashboard contract
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.rank.length, 3);
    assert.equal(response.body.rank[0].rank, 1);
    assert.equal(response.body.rank[1].rank, 2);
    assert.equal(response.body.rank[2].rank, 3);
    assert.equal(response.body.rank[0].user.state, "Maharashtra");
    assert.equal(response.body.rank[0].user.gender, "female");
  } finally {
    Score.find = originalFind;
  }
});

test("getRanking paginates correctly with page and limit, computing global ranks and pagination metadata", async () => {
  const originalFind = Score.find;
  const originalCountDocuments = Score.countDocuments;

  const calls = {
    skip: null,
    limit: null,
    sortArg: null,
  };

  const pageTwoDocs = [
    {
      _id: "score-003",
      score: 80,
      user: { _id: "user-3", fullname: "Charlie", state: "Punjab" },
    },
    {
      _id: "score-004",
      score: 75,
      user: { _id: "user-4", fullname: "Dana", state: "Kerala" },
    },
  ];

  const queryChain = {
    sort(arg) {
      calls.sortArg = arg;
      return this;
    },
    select() {
      return this;
    },
    populate() {
      return this;
    },
    lean() {
      return this;
    },
    skip(n) {
      calls.skip = n;
      return this;
    },
    limit(n) {
      calls.limit = n;
      return this;
    },
    async exec() {
      return pageTwoDocs;
    },
  };

  Score.find = () => queryChain;
  Score.countDocuments = async () => 10;

  const response = {
    statusCode: null,
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

  try {
    await getRanking({ query: { page: "2", limit: "2" } }, response);

    assert.deepEqual(calls.sortArg, { score: -1, _id: 1 });
    assert.equal(calls.skip, 2);
    assert.equal(calls.limit, 2);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.success, true);

    // Global rank: page 2, limit 2 -> items should have ranks 3 and 4
    assert.equal(response.body.rank[0].rank, 3);
    assert.equal(response.body.rank[1].rank, 4);

    // Pagination metadata
    assert.deepEqual(response.body.pagination, {
      page: 2,
      limit: 2,
      total: 10,
      totalPages: 5,
      hasMore: true,
    });
  } finally {
    Score.find = originalFind;
    Score.countDocuments = originalCountDocuments;
  }
});

test("getRanking sanitizes and clamps edge-case pagination inputs", async () => {
  const originalFind = Score.find;
  const originalCountDocuments = Score.countDocuments;

  const calls = {
    skip: null,
    limit: null,
  };

  const queryChain = {
    sort() {
      return this;
    },
    select() {
      return this;
    },
    populate() {
      return this;
    },
    lean() {
      return this;
    },
    skip(n) {
      calls.skip = n;
      return this;
    },
    limit(n) {
      calls.limit = n;
      return this;
    },
    async exec() {
      return [];
    },
  };

  Score.find = () => queryChain;
  Score.countDocuments = async () => 5;

  const response = {
    statusCode: null,
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

  try {
    // Negative page and excessive limit (clamped to max 100)
    await getRanking({ query: { page: "-5", limit: "500" } }, response);

    assert.equal(calls.skip, 0); // page 1 -> skip 0
    assert.equal(calls.limit, 100); // limit clamped to 100
    assert.equal(response.body.pagination.page, 1);
    assert.equal(response.body.pagination.limit, 100);

    // Invalid non-numeric strings fallback safely
    await getRanking({ query: { page: "invalid", limit: "bad" } }, response);
    assert.equal(calls.skip, 0);
    assert.equal(calls.limit, 10);
    assert.equal(response.body.pagination.page, 1);
    assert.equal(response.body.pagination.limit, 10);

    // Page beyond totalPages
    Score.countDocuments = async () => 10;
    await getRanking({ query: { page: "999", limit: "10" } }, response);
    assert.equal(calls.skip, 9980);
    assert.equal(response.body.pagination.total, 10);
    assert.equal(response.body.pagination.totalPages, 1);
    assert.equal(response.body.pagination.hasMore, false);

    // Empty collection (0 total)
    Score.countDocuments = async () => 0;
    await getRanking({ query: { page: "1", limit: "10" } }, response);
    assert.equal(response.body.pagination.total, 0);
    assert.equal(response.body.pagination.totalPages, 0);
    assert.equal(response.body.pagination.hasMore, false);
  } finally {
    Score.find = originalFind;
    Score.countDocuments = originalCountDocuments;
  }
});

test("getRanking preserves dashboard logic: top five slice and current user location", async () => {
  const originalFind = Score.find;

  // 8 users, where current user is rank 7 (outside top 5)
  const currentUserId = "user-me-7";
  const mockAllDocs = Array.from({ length: 8 }, (_, i) => ({
    _id: `score-${i + 1}`,
    score: 100 - i * 5,
    user: {
      _id: i === 6 ? currentUserId : `user-${i + 1}`,
      fullname: i === 6 ? "My User" : `Athlete ${i + 1}`,
      role: "USER",
      state: "State",
    },
  }));

  const queryChain = {
    sort() {
      return this;
    },
    select() {
      return this;
    },
    populate() {
      return this;
    },
    lean() {
      return this;
    },
    async exec() {
      return mockAllDocs;
    },
  };

  Score.find = () => queryChain;

  const response = {
    statusCode: null,
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

  try {
    // Unpaginated request as sent by Dashboard
    await getRanking({}, response);

    assert.equal(response.statusCode, 200);
    const returnedRank = response.body.rank;

    // Simulate Dashboard.jsx processing
    const rankWithIsMe = returnedRank.map((item, index) => ({
      ...item,
      originalRank: index + 1,
      isMe: item.user?._id === currentUserId,
    }));

    const topFive = rankWithIsMe.slice(0, 5);
    const isMeInTopFive = topFive.some((p) => p.isMe);
    assert.equal(isMeInTopFive, false);

    // Current user found outside top five
    const myData = rankWithIsMe.find((p) => p.isMe);
    assert.ok(myData, "Current user should be found in unpaginated ranking");
    assert.equal(myData.originalRank, 7);
    assert.equal(myData.rank, 7);

    // Dashboard display includes top 5 + current user
    const displayRankings = [...topFive, myData];
    assert.equal(displayRankings.length, 6);
    assert.equal(displayRankings[5].user.fullname, "My User");
    assert.equal(displayRankings[5].originalRank, 7);
  } finally {
    Score.find = originalFind;
  }
});

test("getRanking returns 500 when database query throws an error", async () => {
  const originalFind = Score.find;

  Score.find = () => ({
    sort() {
      return this;
    },
    select() {
      return this;
    },
    populate() {
      return this;
    },
    lean() {
      return this;
    },
    async exec() {
      throw new Error("Database connection failure");
    },
  });

  const response = {
    statusCode: null,
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

  try {
    await getRanking({}, response);

    assert.equal(response.statusCode, 500);
    assert.deepEqual(response.body, {
      success: false,
      message: "Database connection failure",
    });
  } finally {
    Score.find = originalFind;
  }
});

test("getRanking unpaginated query returns empty rank array when collection is empty", async () => {
  const originalFind = Score.find;

  const queryChain = {
    sort() {
      return this;
    },
    select() {
      return this;
    },
    populate() {
      return this;
    },
    lean() {
      return this;
    },
    async exec() {
      return [];
    },
  };

  Score.find = () => queryChain;

  const response = {
    statusCode: null,
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

  try {
    await getRanking({}, response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, {
      success: true,
      rank: [],
    });
  } finally {
    Score.find = originalFind;
  }
});
