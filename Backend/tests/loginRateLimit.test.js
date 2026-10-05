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
    let rateLimited = false;

    // Send 6 requests; max allowed is 5 per 15 min
    for (let i = 0; i < 6; i++) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "limiter-test@example.com",
          password: "WrongPassword123!",
        }),
      });

      if (res.status === 429) {
        rateLimited = true;
        const body = await res.json();
        assert.ok(
          body.error.includes("Too many login attempts"),
          `Expected error message, got: ${JSON.stringify(body)}`,
        );
        break;
      }
    }

    assert.equal(
      rateLimited,
      true,
      "Expected 6th request to be rate limited (429)",
    );
  } finally {
    server.close();
  }
});
