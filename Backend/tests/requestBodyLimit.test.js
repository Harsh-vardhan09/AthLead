import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { errorHandler } from "../middleware/errorHandler.js";

const setupTestServer = () => {
  const app = express();
  app.use(express.json({ limit: "100kb" }));
  app.use(
    express.urlencoded({
      extended: true,
      limit: "100kb",
    }),
  );

  let routeHandlerExecuted = false;

  app.post("/test-body", (req, res) => {
    routeHandlerExecuted = true;
    res.status(200).json({ success: true, received: req.body });
  });

  app.use(errorHandler);

  const server = app.listen(0);
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}/test-body`;

  return {
    server,
    url,
    wasRouteHandlerExecuted: () => routeHandlerExecuted,
  };
};

test("JSON request within the 100kb limit is accepted and handled successfully", async () => {
  const { server, url, wasRouteHandlerExecuted } = setupTestServer();

  try {
    const validPayload = JSON.stringify({
      data: "a".repeat(10 * 1024), // ~10kb, safely below 100kb limit
    });

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: validPayload,
    });

    assert.equal(res.status, 200);
    assert.equal(wasRouteHandlerExecuted(), true);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.received.data.length, 10 * 1024);
  } finally {
    server.close();
  }
});

test("JSON request exceeding the 100kb limit is rejected with HTTP 413", async () => {
  const { server, url, wasRouteHandlerExecuted } = setupTestServer();

  try {
    const oversizedPayload = JSON.stringify({
      data: "a".repeat(110 * 1024), // ~110kb, safely above 100kb limit
    });

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: oversizedPayload,
    });

    assert.equal(res.status, 413);
    assert.equal(
      wasRouteHandlerExecuted(),
      false,
      "Route handler must not be executed when request body exceeds size limit",
    );

    const body = await res.json();
    assert.deepEqual(body, {
      success: false,
      message: "Request body too large",
    });
  } finally {
    server.close();
  }
});

test("URL-encoded request within the 100kb limit is accepted and handled successfully", async () => {
  const { server, url, wasRouteHandlerExecuted } = setupTestServer();

  try {
    const validPayload = `data=${"a".repeat(10 * 1024)}`; // ~10kb, safely below 100kb limit

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: validPayload,
    });

    assert.equal(res.status, 200);
    assert.equal(wasRouteHandlerExecuted(), true);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.received.data.length, 10 * 1024);
  } finally {
    server.close();
  }
});

test("URL-encoded request exceeding the 100kb limit is rejected with HTTP 413", async () => {
  const { server, url, wasRouteHandlerExecuted } = setupTestServer();

  try {
    const oversizedPayload = `data=${"a".repeat(110 * 1024)}`; // ~110kb, safely above 100kb limit

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: oversizedPayload,
    });

    assert.equal(res.status, 413);
    assert.equal(
      wasRouteHandlerExecuted(),
      false,
      "Route handler must not be executed when request body exceeds size limit",
    );

    const body = await res.json();
    assert.deepEqual(body, {
      success: false,
      message: "Request body too large",
    });
  } finally {
    server.close();
  }
});

test("Oversized request response returns the exact standardized error format", async () => {
  const { server, url } = setupTestServer();

  try {
    const oversizedPayload = JSON.stringify({
      data: "a".repeat(110 * 1024),
    });

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: oversizedPayload,
    });

    assert.equal(res.status, 413);

    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Request body too large");
    assert.equal(Object.keys(body).length, 2);
  } finally {
    server.close();
  }
});
