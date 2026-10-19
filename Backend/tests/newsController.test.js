import assert from "node:assert/strict";
import test from "node:test";
import GNews from "@gnews-io/gnews-io-js";
import { getNews } from "../controllers/newsController.js";

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

test("getNews returns HTTP 200 with article list on successful API response", async () => {
  const originalSearch = GNews.prototype.search;
  let capturedQuery = null;
  let capturedOptions = null;

  const mockArticles = [
    {
      title: "India Wins Gold in Asian Athletics",
      description: "Indian sprinters achieved top podium finish.",
      url: "https://example.com/news/1",
      publishedAt: "2026-10-18T10:00:00Z",
    },
  ];

  GNews.prototype.search = async (query, options) => {
    capturedQuery = query;
    capturedOptions = options;
    return { articles: mockArticles };
  };

  try {
    const req = {};
    const res = createMockResponse();

    await getNews(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      success: true,
      message: mockArticles,
    });

    assert.equal(capturedQuery, 'sports OR "sports ministry" OR athletics');
    assert.equal(capturedOptions.lang, "en");
    assert.equal(capturedOptions.country, "in");
    assert.equal(capturedOptions.max, 10);
    assert.ok(
      typeof capturedOptions.from === "string",
      "Expected from parameter to be an ISO date string",
    );
    assert.ok(
      !isNaN(Date.parse(capturedOptions.from)),
      "Expected valid ISO date string for from parameter",
    );
  } finally {
    GNews.prototype.search = originalSearch;
  }
});

test("getNews returns HTTP 503 when external service responds with 429 rate limit", async () => {
  const originalSearch = GNews.prototype.search;
  const originalConsoleError = console.error;
  console.error = () => {};

  GNews.prototype.search = async () => {
    const rateLimitError = new Error("Rate limit exceeded");
    rateLimitError.status = 429;
    throw rateLimitError;
  };

  try {
    const req = {};
    const res = createMockResponse();

    await getNews(req, res);

    assert.equal(res.statusCode, 503);
    assert.deepEqual(res.body, {
      success: false,
      message: "Failed to fetch news",
    });
  } finally {
    GNews.prototype.search = originalSearch;
    console.error = originalConsoleError;
  }
});

test("getNews returns HTTP 503 when external service encounters 5xx server outage", async () => {
  const originalSearch = GNews.prototype.search;
  const originalConsoleError = console.error;
  console.error = () => {};

  GNews.prototype.search = async () => {
    const serverError = new Error("Internal Server Error from upstream");
    serverError.status = 502;
    throw serverError;
  };

  try {
    const req = {};
    const res = createMockResponse();

    await getNews(req, res);

    assert.equal(res.statusCode, 503);
    assert.deepEqual(res.body, {
      success: false,
      message: "Failed to fetch news",
    });
  } finally {
    GNews.prototype.search = originalSearch;
    console.error = originalConsoleError;
  }
});

test("getNews returns HTTP 500 for generic/network exceptions without leaking stack trace", async () => {
  const originalSearch = GNews.prototype.search;
  const originalConsoleError = console.error;
  console.error = () => {};

  GNews.prototype.search = async () => {
    const networkError = new Error("ECONNRESET: connection reset by peer");
    throw networkError;
  };

  try {
    const req = {};
    const res = createMockResponse();

    await getNews(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, {
      success: false,
      message: "Failed to fetch news",
    });
    assert.equal(res.body.stack, undefined);
  } finally {
    GNews.prototype.search = originalSearch;
    console.error = originalConsoleError;
  }
});

test("getNews handles empty article list cleanly", async () => {
  const originalSearch = GNews.prototype.search;

  GNews.prototype.search = async () => ({
    articles: [],
  });

  try {
    const req = {};
    const res = createMockResponse();

    await getNews(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      success: true,
      message: [],
    });
  } finally {
    GNews.prototype.search = originalSearch;
  }
});
