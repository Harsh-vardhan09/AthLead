import mongoose from "mongoose";

const RefreshTokenSchema = new mongoose.Schema({
  // SHA-256 hash of the JWT — never store the raw token
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  // All tokens in a single rotation chain share the same family UUID.
  // When reuse of a revoked token is detected, the entire family is revoked.
  family: {
    type: String,
    required: true,
    index: true,
  },
  revoked: {
    type: Boolean,
    default: false,
  },
  // MongoDB TTL index will auto-delete the document after this date
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
});

const RefreshToken = mongoose.model("RefreshToken", RefreshTokenSchema);

export { RefreshToken };
