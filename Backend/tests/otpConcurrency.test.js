import test, { mock } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import crypto from "crypto";
import emailjs from "@emailjs/nodejs";
import { Otp } from "../models/Otp.js";
import { resendOtp, verifyOtp } from "../controllers/OtpController.js";

const TEST_MONGO_URI =
  process.env.TEST_MONGODB_URI ||
  "mongodb://127.0.0.1:27017/athlead_otp_concurrency_test";

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

let isMongoAvailable = false;

test.before(async () => {
  try {
    await mongoose.connect(TEST_MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    isMongoAvailable = true;
    await Otp.deleteMany({});
  } catch (err) {
    isMongoAvailable = false;
    console.warn(
      "MongoDB not available for real integration tests:",
      err.message,
    );
  }
});

test.after(async () => {
  if (isMongoAvailable) {
    try {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    } catch {
      // ignore teardown errors
    }
  }
});

test("Test 1: Two simultaneous resend requests for the same eligible session — at most one is accepted and only one email sent", async (t) => {
  if (!isMongoAvailable) {
    t.skip("MongoDB required for real concurrency integration test");
    return;
  }

  let emailsSent = 0;
  mock.method(emailjs, "send", async () => {
    emailsSent++;
    return { status: 200, text: "OK" };
  });

  const sessionId = crypto.randomUUID();
  const pastDate = new Date(Date.now() - 70 * 1000); // 70s ago (cooldown satisfied)
  const otpDoc = new Otp({
    sessionId,
    email: "athlete1@example.com",
    lastSentAt: pastDate,
    createdAt: pastDate,
    resendCount: 0,
  });
  otpDoc.setOtp("111111");
  otpDoc.lastSentAt = pastDate;
  await otpDoc.save();

  const res1 = createResponse();
  const res2 = createResponse();

  // Fire two simultaneous requests
  await Promise.all([
    resendOtp({ body: { sessionId } }, res1),
    resendOtp({ body: { sessionId } }, res2),
  ]);

  const statuses = [res1.statusCode, res2.statusCode].sort();
  assert.deepEqual(
    statuses,
    [200, 429],
    "Exactly one request must succeed (200) and one must be rejected (429)",
  );

  // Exactly one email should be sent
  assert.equal(emailsSent, 1, "Only the winning request may send an email");

  // Verify database state: resendCount must be exactly 1
  const updated = await Otp.findOne({ sessionId });
  assert.equal(updated.resendCount, 1);
});

test("Test 2: Concurrent resend attempts near the cap cannot exceed MAX_RESENDS", async (t) => {
  if (!isMongoAvailable) {
    t.skip("MongoDB required for real concurrency integration test");
    return;
  }

  let emailsSent = 0;
  mock.method(emailjs, "send", async () => {
    emailsSent++;
    return { status: 200, text: "OK" };
  });

  const sessionId = crypto.randomUUID();
  const pastDate = new Date(Date.now() - 70 * 1000);
  const otpDoc = new Otp({
    sessionId,
    email: "athlete2@example.com",
    lastSentAt: pastDate,
    createdAt: pastDate,
    resendCount: 2, // cap is 3, exactly 1 resend remaining
  });
  otpDoc.setOtp("222222");
  otpDoc.lastSentAt = pastDate;
  await otpDoc.save();

  const responses = [createResponse(), createResponse(), createResponse()];

  // Fire 3 simultaneous resends
  await Promise.all(
    responses.map((res) => resendOtp({ body: { sessionId } }, res)),
  );

  const successCount = responses.filter((r) => r.statusCode === 200).length;
  const rateLimitedCount = responses.filter((r) => r.statusCode === 429).length;

  assert.equal(successCount, 1, "Exactly one resend request can succeed");
  assert.equal(
    rateLimitedCount,
    2,
    "Other concurrent resends must be rate-limited (429)",
  );
  assert.equal(emailsSent, 1, "Only one email sent");

  // Database resend count must not exceed 3
  const updated = await Otp.findOne({ sessionId });
  assert.equal(updated.resendCount, 3);
});

test("Test 3: Resend correctly updates OTP hash, expiry, cooldown timestamp, and resets attempts", async (t) => {
  if (!isMongoAvailable) {
    t.skip("MongoDB required for real concurrency integration test");
    return;
  }

  mock.method(emailjs, "send", async () => ({ status: 200, text: "OK" }));

  const sessionId = crypto.randomUUID();
  const pastDate = new Date(Date.now() - 70 * 1000);
  const otpDoc = new Otp({
    sessionId,
    email: "athlete3@example.com",
    lastSentAt: pastDate,
    createdAt: pastDate,
    resendCount: 0,
    attempts: 3,
  });
  otpDoc.setOtp("333333");
  const oldHash = otpDoc.otpHash;
  otpDoc.lastSentAt = pastDate;
  await otpDoc.save();

  const res = createResponse();
  await resendOtp({ body: { sessionId } }, res);

  assert.equal(res.statusCode, 200);

  const updated = await Otp.findOne({ sessionId });
  assert.notEqual(updated.otpHash, oldHash, "OTP hash must be refreshed");
  assert.equal(updated.resendCount, 1, "Resend count must increment to 1");
  assert.equal(updated.attempts, 0, "Attempts must be reset to 0");
  assert.ok(
    updated.lastSentAt.getTime() > pastDate.getTime(),
    "lastSentAt must be updated to current time",
  );
  assert.ok(
    updated.expiresAt.getTime() > Date.now(),
    "expiresAt must be extended into future",
  );
});

test("Test 4: Concurrent invalid verification attempts cannot lose attempt-counter updates or exceed MAX_ATTEMPTS", async (t) => {
  if (!isMongoAvailable) {
    t.skip("MongoDB required for real concurrency integration test");
    return;
  }

  const sessionId = crypto.randomUUID();
  const otpDoc = new Otp({
    sessionId,
    email: "athlete4@example.com",
    resendCount: 0,
  });
  otpDoc.setOtp("444444");
  otpDoc.attempts = 3; // 2 attempts remaining until MAX_ATTEMPTS (5)
  await otpDoc.save();

  // Send 4 concurrent incorrect verification attempts
  const responses = [
    createResponse(),
    createResponse(),
    createResponse(),
    createResponse(),
  ];

  await Promise.all(
    responses.map((res, i) =>
      verifyOtp({ body: { sessionId, otp: `00000${i}` } }, res),
    ),
  );

  // The 4th attempt or any attempt that hits 5 must trigger 429 locked
  const lockResponses = responses.filter(
    (r) => r.statusCode === 429 && r.body?.locked === true,
  );
  assert.ok(
    lockResponses.length >= 1,
    "At least one response must be HTTP 429 with locked: true",
  );

  // Session must be deleted from the database
  const remainingDoc = await Otp.findOne({ sessionId });
  assert.equal(
    remainingDoc,
    null,
    "Session must be deleted after reaching MAX_ATTEMPTS",
  );
});

test("Test 5: Concurrent valid and invalid verifications preserve verified state", async (t) => {
  if (!isMongoAvailable) {
    t.skip("MongoDB required for real concurrency integration test");
    return;
  }

  const sessionId = crypto.randomUUID();
  const otpDoc = new Otp({
    sessionId,
    email: "athlete5@example.com",
    resendCount: 0,
    attempts: 0,
  });
  otpDoc.setOtp("555555");
  await otpDoc.save();

  const resValid = createResponse();
  const resInvalid = createResponse();

  // Run valid verification concurrently with invalid verification
  await Promise.all([
    verifyOtp({ body: { sessionId, otp: "555555" } }, resValid),
    verifyOtp({ body: { sessionId, otp: "000000" } }, resInvalid),
  ]);

  assert.equal(resValid.statusCode, 200, "Valid attempt must succeed");

  // The verified status must remain true in database and cannot be reverted
  const finalDoc = await Otp.findOne({ sessionId });
  assert.ok(finalDoc, "Document must still exist");
  assert.equal(finalDoc.verified, true, "Verified state must remain true");
});

test("Test 6: Multiple concurrent valid verifications succeed without conflict", async (t) => {
  if (!isMongoAvailable) {
    t.skip("MongoDB required for real concurrency integration test");
    return;
  }

  const sessionId = crypto.randomUUID();
  const otpDoc = new Otp({
    sessionId,
    email: "athlete6@example.com",
    resendCount: 0,
    attempts: 0,
  });
  otpDoc.setOtp("666666");
  await otpDoc.save();

  const res1 = createResponse();
  const res2 = createResponse();

  await Promise.all([
    verifyOtp({ body: { sessionId, otp: "666666" } }, res1),
    verifyOtp({ body: { sessionId, otp: "666666" } }, res2),
  ]);

  assert.equal(res1.statusCode, 200);
  assert.equal(res2.statusCode, 200);

  const finalDoc = await Otp.findOne({ sessionId });
  assert.equal(finalDoc.verified, true);
});

test("Test 7: Expired and already verified sessions cannot be resent or verified again", async (t) => {
  if (!isMongoAvailable) {
    t.skip("MongoDB required for real concurrency integration test");
    return;
  }

  // 7a. Expired session
  const expiredSessionId = crypto.randomUUID();
  const expiredDoc = new Otp({
    sessionId: expiredSessionId,
    email: "athlete7a@example.com",
    expiresAt: new Date(Date.now() - 5000), // 5 seconds expired
    lastSentAt: new Date(Date.now() - 70000),
  });
  expiredDoc.setOtp("777777");
  expiredDoc.expiresAt = new Date(Date.now() - 5000); // ensure expired
  await expiredDoc.save();

  const resExpResend = createResponse();
  await resendOtp({ body: { sessionId: expiredSessionId } }, resExpResend);
  assert.equal(resExpResend.statusCode, 400);
  assert.equal(resExpResend.body.expired, true);

  const resExpVerify = createResponse();
  await verifyOtp(
    { body: { sessionId: expiredSessionId, otp: "777777" } },
    resExpVerify,
  );
  assert.equal(resExpVerify.statusCode, 400);

  // 7b. Already verified session
  const verifiedSessionId = crypto.randomUUID();
  const verifiedDoc = new Otp({
    sessionId: verifiedSessionId,
    email: "athlete7b@example.com",
    verified: true,
    lastSentAt: new Date(Date.now() - 70000),
  });
  verifiedDoc.setOtp("777778");
  await verifiedDoc.save();

  const resVerResend = createResponse();
  await resendOtp({ body: { sessionId: verifiedSessionId } }, resVerResend);
  assert.equal(resVerResend.statusCode, 404);

  const resVerVerify = createResponse();
  await verifyOtp(
    { body: { sessionId: verifiedSessionId, otp: "777778" } },
    resVerVerify,
  );
  assert.equal(resVerVerify.statusCode, 400);
});

test("Test 8: Missing session ID or OTP returns HTTP 400", async () => {
  const res1 = createResponse();
  await resendOtp({ body: {} }, res1);
  assert.equal(res1.statusCode, 400);
  assert.equal(res1.body.message, "Session ID is required");

  const res2 = createResponse();
  await verifyOtp({ body: { sessionId: "some-sess" } }, res2);
  assert.equal(res2.statusCode, 400);
  assert.equal(res2.body.message, "Session ID and OTP are required");

  const res3 = createResponse();
  await verifyOtp({ body: { otp: "123456" } }, res3);
  assert.equal(res3.statusCode, 400);
  assert.equal(res3.body.message, "Session ID and OTP are required");
});

test("Test 9: Concurrent resend and verification prevents old OTP from verifying regenerated session", async (t) => {
  if (!isMongoAvailable) {
    t.skip("MongoDB required for real concurrency integration test");
    return;
  }

  mock.method(emailjs, "send", async () => ({ status: 200, text: "OK" }));

  const sessionId = crypto.randomUUID();
  const pastDate = new Date(Date.now() - 70 * 1000);
  const otpDoc = new Otp({
    sessionId,
    email: "athlete9@example.com",
    lastSentAt: pastDate,
    createdAt: pastDate,
    resendCount: 0,
  });
  otpDoc.setOtp("123456"); // original OTP
  otpDoc.lastSentAt = pastDate;
  await otpDoc.save();

  const resResend = createResponse();
  const resVerifyOld = createResponse();

  // Execute resend concurrently with a verification using the old OTP
  await Promise.all([
    resendOtp({ body: { sessionId } }, resResend),
    verifyOtp({ body: { sessionId, otp: "123456" } }, resVerifyOld),
  ]);

  assert.equal(resResend.statusCode, 200, "Resend must succeed");

  // The session in database must not be marked verified using the old OTP
  const finalDoc = await Otp.findOne({ sessionId });
  assert.ok(finalDoc);
  assert.equal(
    finalDoc.verified,
    false,
    "Session must not be verified by the old OTP after resend",
  );
});

test("Test 10: Resend within cooldown does not dispatch email and returns HTTP 429", async (t) => {
  if (!isMongoAvailable) {
    t.skip("MongoDB required for real concurrency integration test");
    return;
  }

  let emailsSent = 0;
  mock.method(emailjs, "send", async () => {
    emailsSent++;
    return { status: 200, text: "OK" };
  });

  const sessionId = crypto.randomUUID();
  const recentDate = new Date(Date.now() - 10 * 1000); // 10s ago (within 60s cooldown)
  const otpDoc = new Otp({
    sessionId,
    email: "athlete10@example.com",
    lastSentAt: recentDate,
    createdAt: recentDate,
    resendCount: 0,
  });
  otpDoc.setOtp("999999");
  otpDoc.lastSentAt = recentDate;
  await otpDoc.save();

  const res = createResponse();
  await resendOtp({ body: { sessionId } }, res);

  assert.equal(res.statusCode, 429);
  assert.ok(res.body.message.includes("before resending"));
  assert.equal(
    emailsSent,
    0,
    "No email should be sent when cooldown is active",
  );
});

test("Test 11: Email delivery failure during resend returns HTTP 500 safely", async (t) => {
  if (!isMongoAvailable) {
    t.skip("MongoDB required for real concurrency integration test");
    return;
  }

  mock.method(emailjs, "send", async () => {
    throw new Error("SMTP connection timeout");
  });

  const sessionId = crypto.randomUUID();
  const pastDate = new Date(Date.now() - 70 * 1000);
  const otpDoc = new Otp({
    sessionId,
    email: "athlete11@example.com",
    lastSentAt: pastDate,
    createdAt: pastDate,
    resendCount: 0,
  });
  otpDoc.setOtp("112233");
  otpDoc.lastSentAt = pastDate;
  await otpDoc.save();

  const res = createResponse();
  await resendOtp({ body: { sessionId } }, res);

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.message, "Failed to resend OTP");
});

test("Test 12: Stale lockout cleanup does not delete a concurrently resent OTP session", async (t) => {
  if (!isMongoAvailable) {
    t.skip("MongoDB required for real concurrency integration test");
    return;
  }

  let capturedResentOtp = null;
  mock.method(emailjs, "send", async (_service, _template, params) => {
    capturedResentOtp = params?.otp;
    return { status: 200, text: "OK" };
  });

  const sessionId = crypto.randomUUID();
  const pastDate = new Date(Date.now() - 70 * 1000); // 70s ago (cooldown elapsed)
  const otpDoc = new Otp({
    sessionId,
    email: "athlete12@example.com",
    lastSentAt: pastDate,
    createdAt: pastDate,
    resendCount: 0,
  });
  otpDoc.setOtp("121212"); // initial OTP
  otpDoc.attempts = 4; // 1 attempt away from lockout (MAX_ATTEMPTS = 5)
  otpDoc.lastSentAt = pastDate;
  await otpDoc.save();

  const originalDeleteOne = Otp.deleteOne.bind(Otp);
  let resendTriggered = false;

  // Intercept Otp.deleteOne: right before the 5th attempt deletes the document,
  // execute resendOtp to simulate a concurrent resend interleaving
  mock.method(Otp, "deleteOne", async (filter, options) => {
    if (!resendTriggered) {
      resendTriggered = true;
      const resResend = createResponse();
      await resendOtp({ body: { sessionId } }, resResend);
      assert.equal(
        resResend.statusCode,
        200,
        "Concurrent resend must succeed and refresh session",
      );
    }
    return originalDeleteOne(filter, options);
  });

  // Trigger the 5th invalid attempt (hits attempt limit)
  const resVerify5th = createResponse();
  await verifyOtp({ body: { sessionId, otp: "000000" } }, resVerify5th);

  // The 5th invalid attempt returns HTTP 429 locked
  assert.equal(resVerify5th.statusCode, 429);
  assert.equal(resVerify5th.body.locked, true);

  // CRITICAL REGRESSION ASSERTION:
  // The newly resent session MUST NOT have been deleted by the stale lockout cleanup!
  const sessionAfterCleanup = await Otp.findOne({ sessionId });
  assert.ok(
    sessionAfterCleanup,
    "The resent session must still exist in MongoDB after stale lockout cleanup",
  );
  assert.equal(
    sessionAfterCleanup.attempts,
    0,
    "Resent session attempts must be reset to 0",
  );
  assert.equal(
    sessionAfterCleanup.resendCount,
    1,
    "Resent session resendCount must be 1",
  );
  assert.notEqual(
    sessionAfterCleanup.otpHash,
    otpDoc.otpHash,
    "Resent session must hold the new OTP hash",
  );

  // The newly received OTP from the resend must verify successfully
  assert.ok(
    capturedResentOtp,
    "A new OTP must have been generated and emailed",
  );
  const resVerifyNew = createResponse();
  await verifyOtp(
    { body: { sessionId, otp: capturedResentOtp } },
    resVerifyNew,
  );
  assert.equal(
    resVerifyNew.statusCode,
    200,
    "New OTP must verify successfully",
  );

  const finalVerifiedDoc = await Otp.findOne({ sessionId });
  assert.equal(finalVerifiedDoc.verified, true);
});
