import crypto from "crypto";
import { Otp } from "../models/Otp.js";
import { User } from "../models/Users.js";
import { normalizeEmail } from "../utils/normalizeEmail.js";
import { sendOtpEmail } from "../utils/sendOtpEmail.js";
import { hashSync } from "bcrypt";
import { signupVal } from "../utils/zodValidation.js";

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute between resends

/** Cryptographically secure 6-digit OTP. */
const generateOtp = () => String(crypto.randomInt(100000, 999999));

/** UUID v4 used as the client-facing session key (never exposes email). */
const generateSessionId = () => crypto.randomUUID();

// ─── POST /api/auth/send-otp ─────────────────────────────────────────────────
/**
 * Creates a new OTP session for the given email.
 * Returns { success, sessionId } — the client stores sessionId in localStorage
 * and passes it to verify-otp, resend-otp, and signup instead of the email.
 */
export const sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }

  const normalizedEmail = normalizeEmail(email);

  try {
    // Block if an account with this email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    // Remove any stale sessions for this email before creating a fresh one
    await Otp.deleteMany({ email: normalizedEmail });

    const sessionId = generateSessionId();
    const plainOtp = generateOtp();
    const otpDoc = new Otp({ sessionId, email: normalizedEmail });
    otpDoc.setOtp(plainOtp);
    await otpDoc.save();

    // Fire-and-forget is intentional: we respond immediately so the UI feels fast.
    // Email delivery failure is surfaced via the catch block below.
    await sendOtpEmail(normalizedEmail, plainOtp);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      sessionId, // ← client saves this to localStorage
    });
  } catch (error) {
    console.error("sendOtp error:", error);
    console.error("message:", error.message);
    console.error("stack:", error.stack);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── POST /api/auth/resend-otp ───────────────────────────────────────────────
/**
 * Regenerates the OTP for an existing session.
 * Requires { sessionId } in the body — no email needed.
 * Enforces a 60-second cooldown via lastSentAt.
 */
export const resendOtp = async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res
      .status(400)
      .json({ success: false, message: "Session ID is required" });
  }

  try {
    const otpDoc = await Otp.findOne({ sessionId, verified: false });

    if (!otpDoc) {
      return res.status(404).json({
        success: false,
        message: "Session not found or already verified. Please start over.",
      });
    }

    // Cooldown guard
    const elapsed = Date.now() - new Date(otpDoc.lastSentAt).getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const waitSecs = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSecs}s before resending`,
      });
    }

    // Generate a new OTP and overwrite the hash in the same document.
    // The sessionId stays the same — client does not need to update localStorage.
    const plainOtp = generateOtp();
    otpDoc.setOtp(plainOtp); // also resets attempts and bumps lastSentAt
    await otpDoc.save();

    await sendOtpEmail(otpDoc.email, plainOtp);

    return res
      .status(200)
      .json({ success: true, message: "OTP resent successfully" });
  } catch (error) {
    console.error("resendOtp error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to resend OTP" });
  }
};

// ─── POST /api/auth/verify-otp ───────────────────────────────────────────────
/**
 * Verifies the OTP for a given session.
 * Requires { sessionId, otp } — no email in the request body.
 */
export const verifyOtp = async (req, res) => {
  const { sessionId, otp } = req.body;

  if (!sessionId || !otp) {
    return res
      .status(400)
      .json({ success: false, message: "Session ID and OTP are required" });
  }

  try {
    const otpDoc = await Otp.findOne({ sessionId, verified: false });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired session. Please request a new OTP.",
      });
    }

    // Application-level expiry check (5 min), independent of the DB TTL (10 min)
    if (new Date() > otpDoc.expiresAt) {
      await otpDoc.deleteOne();
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new one.",
        expired: true, // client can use this flag to auto-trigger resend UI
      });
    }

    // Max attempts guard
    if (otpDoc.attempts >= MAX_ATTEMPTS) {
      await otpDoc.deleteOne();
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Please request a new OTP.",
        locked: true,
      });
    }

    const isValid = otpDoc.verifyOtp(otp);

    if (!isValid) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      const remaining = MAX_ATTEMPTS - otpDoc.attempts;
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining`,
        attemptsRemaining: remaining,
      });
    }

    // Mark session as verified — signup will check this
    otpDoc.verified = true;
    await otpDoc.save();

    return res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    console.error("verifyOtp error:", error);
    return res
      .status(500)
      .json({ success: false, message: "OTP verification failed" });
  }
};

// ─── POST /api/auth/signup (OTP-gated) ──────────────────────────────────────
/**
 * Creates the user account.
 * Requires { sessionId, ...formFields } — email comes from the verified OTP session,
 * NOT from the request body, preventing email substitution attacks.
 */
export const SingupAuth = async (req, res) => {
  const { sessionId, ...rest } = req.body;

  if (!sessionId) {
    return res
      .status(400)
      .json({ success: false, message: "Session ID is required" });
  }

  try {
    // Load the verified session — this also gives us the trusted email
    const otpDoc = await Otp.findOne({ sessionId, verified: true });
    if (!otpDoc) {
      return res.status(403).json({
        success: false,
        message: "Email not verified. Please complete OTP verification first.",
      });
    }

    // Merge the session email into the body for Zod validation
    const payload = { ...rest, email: otpDoc.email };
    const result = signupVal.safeParse(payload);

    if (!result.success) {
      return res.status(400).json({ errors: result.error.format() });
    }

    const { fullname, email, phone, gender, password, DOB } = result.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = hashSync(password, 10);

    await User.create({
      fullname,
      email,
      phone,
      gender,
      password: hashedPassword,
      DOB,
    });

    // Clean up the OTP session — it's been consumed
    await otpDoc.deleteOne();

    return res
      .status(201)
      .json({ success: true, message: "Sign Up Successful" });
  } catch (error) {
    console.error("SingupAuth error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
