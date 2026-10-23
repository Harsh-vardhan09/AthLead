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

// Minimal in-memory interpreter for the aggregation stages getRanking uses, so
// the tests exercise the real pipeline rather than a hand-written mock result.
const field = (ref) => ref.slice(1);
const compareBy = (spec) => (a, b) => {
  for (const [key, dir] of Object.entries(spec)) {
    if (a[key] < b[key]) return -dir;
    if (a[key] > b[key]) return dir;
  }
  return 0;
};
const runPipeline = (docs, pipeline) =>
  pipeline.reduce((current, stage) => {
    if (stage.$sort) return [...current].sort(compareBy(stage.$sort));
    if (stage.$group) {
      const { _id, ...accumulators } = stage.$group;
      const groups = new Map();
      for (const doc of current) {
        const key = doc[field(_id)];
        if (!groups.has(key)) {
          groups.set(key, {
            _id: key,
            ...Object.fromEntries(
              Object.entries(accumulators).map(([name, acc]) => [
                name,
                doc[field(acc.$first)],
              ]),
            ),
          });
        }
      }
      return [...groups.values()];
    }
    if (stage.$project) {
      return current.map((doc) =>
        Object.fromEntries(
          Object.entries(stage.$project).map(([name, spec]) => [
            name,
            typeof spec === "string" ? doc[field(spec)] : doc[name],
          ]),
        ),
      );
    }
    if (stage.$skip !== undefined) return current.slice(stage.$skip);
    if (stage.$limit !== undefined) return current.slice(0, stage.$limit);
    if (stage.$count)
      return current.length ? [{ [stage.$count]: current.length }] : [];
    if (stage.$facet) {
      return [
        Object.fromEntries(
          Object.entries(stage.$facet).map(([name, sub]) => [
            name,
            runPipeline(current, sub),
          ]),
        ),
      ];
    }
    throw new Error(`Unsupported stage ${JSON.stringify(stage)}`);
  }, docs);

const users = {
  a: { _id: "a", fullname: "Alice Runner", state: "Maharashtra" },
  b: { _id: "b", fullname: "Bob Cyclist", state: "Karnataka" },
  c: { _id: "c", fullname: "Charlie Swimmer", state: "Delhi" },
};

const stubScore = (scores) => {
  const original = {
    aggregate: Score.aggregate,
    populate: Score.populate,
  };
  Score.aggregate = async (pipeline) => runPipeline(scores, pipeline);
  Score.populate = async (docs, options) => {
    assert.equal(options.path, "user");
    assert.equal(options.select, "fullname image state gender");
    return docs.map((doc) => ({ ...doc, user: users[doc.user] ?? null }));
  };
  return () => Object.assign(Score, original);
};

const makeResponse = () => ({
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
});

// Alice generated three scores, Bob two (one tied with Alice's best), Charlie one.
const manyScores = [
  { _id: "s1", user: "a", score: 90 },
  { _id: "s2", user: "a", score: 88 },
  { _id: "s3", user: "b", score: 90 },
  { _id: "s4", user: "a", score: 85 },
  { _id: "s5", user: "c", score: 70 },
  { _id: "s6", user: "b", score: 60 },
];

test("getRanking returns one row per athlete using their best score", async () => {
  const restore = stubScore(manyScores);
  const response = makeResponse();
  try {
    await getRanking({ query: {} }, response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(
      response.body.rank.map((r) => [r.user._id, r.score, r.rank]),
      [
        ["a", 90, 1],
        ["b", 90, 2],
        ["c", 70, 3],
      ],
    );
  } finally {
    restore();
  }
});

test("getRanking breaks tied best scores by the score _id", async () => {
  const restore = stubScore([
    { _id: "s2", user: "b", score: 80 },
    { _id: "s1", user: "a", score: 80 },
  ]);
  const response = makeResponse();
  try {
    await getRanking({}, response);

    assert.deepEqual(
      response.body.rank.map((r) => r.user._id),
      ["a", "b"],
    );
  } finally {
    restore();
  }
});

test("getRanking preserves the dashboard contract for ranked rows", async () => {
  const restore = stubScore(manyScores);
  const response = makeResponse();
  try {
    await getRanking({ query: {} }, response);

    const [first] = response.body.rank;
    assert.deepEqual(Object.keys(first).sort(), [
      "_id",
      "rank",
      "score",
      "user",
    ]);
    assert.equal(first._id, "s1");
    assert.equal(first.user.state, "Maharashtra");
  } finally {
    restore();
  }
});

test("getRanking paginates athletes, computing global ranks and totals from athletes", async () => {
  const restore = stubScore(manyScores);
  const response = makeResponse();
  try {
    await getRanking({ query: { page: "2", limit: "2" } }, response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(
      response.body.rank.map((r) => [r.user._id, r.rank]),
      [["c", 3]],
    );
    // Six scores but only three athletes
    assert.deepEqual(response.body.pagination, {
      page: 2,
      limit: 2,
      total: 3,
      totalPages: 2,
      hasMore: false,
    });
  } finally {
    restore();
  }
});

test("getRanking sanitizes and clamps edge-case pagination inputs", async () => {
  const restore = stubScore(manyScores);
  const response = makeResponse();
  try {
    await getRanking({ query: { page: "-5", limit: "500" } }, response);
    assert.equal(response.body.pagination.page, 1);
    assert.equal(response.body.pagination.limit, 100);
    assert.equal(response.body.rank.length, 3);

    await getRanking({ query: { page: "invalid", limit: "bad" } }, response);
    assert.equal(response.body.pagination.page, 1);
    assert.equal(response.body.pagination.limit, 10);

    await getRanking({ query: { page: "999", limit: "10" } }, response);
    assert.deepEqual(response.body.rank, []);
    assert.equal(response.body.pagination.total, 3);
    assert.equal(response.body.pagination.totalPages, 1);
    assert.equal(response.body.pagination.hasMore, false);
  } finally {
    restore();
  }
});

test("getRanking reports an empty leaderboard", async () => {
  const restore = stubScore([]);
  const response = makeResponse();
  try {
    await getRanking({}, response);
    assert.deepEqual(response.body, { success: true, rank: [] });

    await getRanking({ query: { page: "1", limit: "10" } }, response);
    assert.deepEqual(response.body.pagination, {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasMore: false,
    });
  } finally {
    restore();
  }
});

test("getRanking returns 500 when the database query throws an error", async () => {
  const originalAggregate = Score.aggregate;
  Score.aggregate = async () => {
    throw new Error("Database connection failure");
  };
  const response = makeResponse();
  try {
    await getRanking({}, response);

    assert.equal(response.statusCode, 500);
    assert.deepEqual(response.body, {
      success: false,
      message: "Database connection failure",
    });
  } finally {
    Score.aggregate = originalAggregate;
  }
});
