import mongoose from "mongoose";
import { hashSync, compareSync } from "bcrypt";

/**
 * Otp document lifecycle:
 *
 *  send-otp  → creates doc  { sessionId (UUID), email, otpHash, expiresAt, verified:false }
 *  verify-otp → finds by sessionId, checks hash → sets verified:true
 *  resend-otp → finds by sessionId, replaces otpHash + resets expiresAt (cooldown enforced)
 *  signup     → finds by sessionId + verified:true → creates User → deletes doc
 *
 * MongoDB TTL index hard-deletes the entire document 10 minutes after createdAt,
 * so abandoned sessions are cleaned up automatically even if the user closes the tab.
 */
const OtpSchema = new mongoose.Schema({
  // UUID returned to the client; used as the lookup key instead of exposing email
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },

  // bcrypt hash of the 6-digit OTP (rounds: 8 for fast verify UX)
  otpHash: {
    type: String,
    required: true,
  },

  // Hard expiry checked in application logic (5 minutes)
  expiresAt: {
    type: Date,
    required: true,
  },

  // Tracks wrong guesses; session is killed after MAX_ATTEMPTS
  attempts: {
    type: Number,
    default: 0,
  },

  // Flipped to true by verify-otp; signup checks this before creating the User
  verified: {
    type: Boolean,
    default: false,
  },

  // Timestamp for resend cooldown checks
  lastSentAt: {
    type: Date,
    default: Date.now,
  },

  // TTL index: MongoDB auto-deletes the document 10 minutes after creation.
  // This is a hard backstop — the app-level expiresAt (5 min) is the user-facing limit.
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // 10 minutes in seconds
  },
});

/**
 * Hash the OTP and set expiry. Call this on both send and resend.
 * Uses bcrypt rounds=8: fast enough for a good UX (~80ms) while still secure.
 */
OtpSchema.methods.setOtp = function (plainOtp) {
  this.otpHash = hashSync(plainOtp, 8);
  this.expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
  this.lastSentAt = new Date();
  this.attempts = 0; // reset attempts on every fresh OTP
};

/** Compare a plain OTP against the stored hash. */
OtpSchema.methods.verifyOtp = function (plainOtp) {
  return compareSync(plainOtp, this.otpHash);
};

const Otp = mongoose.model("Otp", OtpSchema);

export { Otp };
