import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import router from "../routes/userRoutes.js";

test("rate limits /login route after maximum attempts", async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/user", router);

  const server = app.listen(0);
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}/api/v1/user/login`;

  try {
    // Send 5 allowed requests with unique emails to test IP-level rate limiter without DB timeout
    for (let i = 1; i <= 5; i++) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `limiter-test-${i}@example.com`,
        }),
      });

      assert.notEqual(
        res.status,
        429,
        `Request ${i} should not be rate limited (got 429)`,
      );
    }

    // 6th request should be rate limited
    const res6 = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "limiter-test-6@example.com",
      }),
    });

    assert.equal(res6.status, 429, "Expected 6th request to return 429 status");

    const body = await res6.json();
    assert.ok(
      body.error.includes("Too many login attempts"),
      `Expected rate limit error message, got: ${JSON.stringify(body)}`,
    );
  } finally {
    server.close();
  }
});
