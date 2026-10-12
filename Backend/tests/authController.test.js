import assert from "node:assert/strict";
import fs from "fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { mock } from "node:test";
import { v2 as cloudinary } from "cloudinary";
import { User } from "../models/Users.js";
import { editUser } from "../controllers/authController.js";
import { PASSWORD_ERROR_MESSAGE } from "../utils/passwordValidation.js";

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const createTempFile = async () => {
  const tempDir = await fsp.mkdtemp(
    path.join(os.tmpdir(), "athlead-auth-test-"),
  );
  const filePath = path.join(tempDir, "test-avatar.jpg");
  await fsp.writeFile(filePath, "test-image-content");
  return {
    filePath,
    cleanup: async () => {
      await fsp.rm(tempDir, { recursive: true, force: true });
    },
  };
};

test("Test A — Successful image upload updates user and removes temporary file", async () => {
  const { filePath, cleanup } = await createTempFile();
  let updatedPayload = null;

  mock.method(cloudinary.uploader, "upload", async (uploadPath) => {
    assert.equal(uploadPath, filePath);
    return { url: "https://res.cloudinary.com/demo/image/upload/sample.jpg" };
  });

  mock.method(User, "findByIdAndUpdate", async (id, update, options) => {
    updatedPayload = { id, update, options };
    return { _id: id, ...update };
  });

  try {
    const req = {
      user: { _id: "user-123" },
      body: { fullname: "AthLead Runner", phone: "1234567890" },
      file: { path: filePath },
    };
    const res = createResponse();

    await editUser(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { success: true, message: "User Updated" });
    assert.equal(updatedPayload.id, "user-123");
    assert.equal(
      updatedPayload.update.image,
      "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    );
    assert.equal(updatedPayload.update.fullname, "AthLead Runner");
    assert.equal(
      fs.existsSync(filePath),
      false,
      "Temporary file must be removed after successful upload",
    );
  } finally {
    mock.reset();
    await cleanup();
  }
});

test("Test B — Cloudinary upload failure preserves error response and cleans up temporary file", async () => {
  const { filePath, cleanup } = await createTempFile();
  let dbCalled = false;

  mock.method(cloudinary.uploader, "upload", async () => {
    throw new Error("Cloudinary upload failed");
  });

  mock.method(User, "findByIdAndUpdate", async () => {
    dbCalled = true;
  });

  mock.method(console, "log", () => {});

  try {
    const req = {
      user: { _id: "user-123" },
      body: { fullname: "AthLead Runner" },
      file: { path: filePath },
    };
    const res = createResponse();

    await editUser(req, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Cloudinary upload failed");
    assert.equal(
      dbCalled,
      false,
      "User.findByIdAndUpdate must not be called when upload fails",
    );
    assert.equal(
      fs.existsSync(filePath),
      false,
      "Temporary file must be removed after Cloudinary failure",
    );
  } finally {
    mock.reset();
    await cleanup();
  }
});

test("Test C — Invalid password returns HTTP 400, skips Cloudinary, and cleans up temporary file", async () => {
  const { filePath, cleanup } = await createTempFile();
  let cloudinaryCalled = false;
  let dbCalled = false;

  mock.method(cloudinary.uploader, "upload", async () => {
    cloudinaryCalled = true;
    return { url: "https://res.cloudinary.com/demo/image/upload/sample.jpg" };
  });

  mock.method(User, "findByIdAndUpdate", async () => {
    dbCalled = true;
  });

  try {
    const req = {
      user: { _id: "user-123" },
      body: { password: "invalid" },
      file: { path: filePath },
    };
    const res = createResponse();

    await editUser(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, PASSWORD_ERROR_MESSAGE);
    assert.equal(
      cloudinaryCalled,
      false,
      "Cloudinary upload must not be called on invalid password",
    );
    assert.equal(
      dbCalled,
      false,
      "User.findByIdAndUpdate must not be called on invalid password",
    );
    assert.equal(
      fs.existsSync(filePath),
      false,
      "Temporary file must be removed when password validation fails",
    );
  } finally {
    mock.reset();
    await cleanup();
  }
});

test("Test D — Database update failure after successful upload preserves error and cleans up temporary file", async () => {
  const { filePath, cleanup } = await createTempFile();

  mock.method(cloudinary.uploader, "upload", async () => {
    return { url: "https://res.cloudinary.com/demo/image/upload/sample.jpg" };
  });

  mock.method(User, "findByIdAndUpdate", async () => {
    throw new Error("Database update error");
  });

  mock.method(console, "log", () => {});

  try {
    const req = {
      user: { _id: "user-123" },
      body: { fullname: "AthLead Runner" },
      file: { path: filePath },
    };
    const res = createResponse();

    await editUser(req, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Database update error");
    assert.equal(
      fs.existsSync(filePath),
      false,
      "Temporary file must be removed after database update failure",
    );
  } finally {
    mock.reset();
    await cleanup();
  }
});

test("Test E — Request without an uploaded image succeeds without attempting cleanup", async () => {
  let updatedPayload = null;

  mock.method(User, "findByIdAndUpdate", async (id, update, options) => {
    updatedPayload = { id, update, options };
    return { _id: id, ...update };
  });

  try {
    const req = {
      user: { _id: "user-123" },
      body: { fullname: "Updated Name" },
    };
    const res = createResponse();

    await editUser(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { success: true, message: "User Updated" });
    assert.equal(updatedPayload.update.fullname, "Updated Name");
    assert.equal(updatedPayload.update.image, undefined);
  } finally {
    mock.reset();
  }
});

test("Test F — Filesystem cleanup failure does not overwrite controller response", async () => {
  const { filePath, cleanup } = await createTempFile();
  let consoleErrorLogged = false;

  mock.method(console, "error", (msg, err) => {
    if (msg === "Failed to delete temp file:" && err?.code === "EPERM") {
      consoleErrorLogged = true;
    }
  });

  mock.method(cloudinary.uploader, "upload", async () => {
    return { url: "https://res.cloudinary.com/demo/image/upload/sample.jpg" };
  });

  mock.method(User, "findByIdAndUpdate", async (id, update) => {
    return { _id: id, ...update };
  });

  mock.method(fs.promises, "unlink", async () => {
    const error = new Error("Permission denied");
    error.code = "EPERM";
    throw error;
  });

  try {
    const req = {
      user: { _id: "user-123" },
      body: { fullname: "AthLead Runner" },
      file: { path: filePath },
    };
    const res = createResponse();

    await editUser(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { success: true, message: "User Updated" });
    assert.equal(consoleErrorLogged, true, "Cleanup failure should be logged");
  } finally {
    mock.reset();
    await cleanup();
  }
});

test("Test G — ENOENT during cleanup is silently ignored without logging error", async () => {
  const { filePath, cleanup } = await createTempFile();
  // Delete file in advance so unlink triggers ENOENT
  await fsp.unlink(filePath);
  let loggedError = false;

  mock.method(console, "error", () => {
    loggedError = true;
  });

  mock.method(cloudinary.uploader, "upload", async () => {
    return { url: "https://res.cloudinary.com/demo/image/upload/sample.jpg" };
  });

  mock.method(User, "findByIdAndUpdate", async (id, update) => {
    return { _id: id, ...update };
  });

  try {
    const req = {
      user: { _id: "user-123" },
      body: { fullname: "AthLead Runner" },
      file: { path: filePath },
    };
    const res = createResponse();

    await editUser(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { success: true, message: "User Updated" });
    assert.equal(loggedError, false, "ENOENT must not trigger error logging");
  } finally {
    mock.reset();
    await cleanup();
  }
});
