import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  LoginAuth,
  logout,
  getUser,
  editUser,
  refesh,
} from "../controllers/authController.js";
import {
  sendOtp,
  resendOtp,
  verifyOtp,
  SingupAuth,
} from "../controllers/OtpController.js";
import { requireAuth } from "../middleware/middleware.js";
import multer from "multer";

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many requests, please try again later." },
});

// Per-recipient cap: prevents IP-rotating attackers from spamming one email address
const otpEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) =>
    typeof req.body?.email === "string"
      ? req.body.email.toLowerCase().trim()
      : "",
  message: {
    error: "Too many OTP requests for this address. Try again later.",
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many login attempts, please try again later." },
});

const loginEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.toLowerCase().trim()
        : "";
    return `${req.ip}_${email}`;
  },
  message: {
    error: "Too many login attempts for this address. Try again later.",
  },
});

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG or WebP images are allowed"), false);
    }
  },
});

const router = Router();

// OTP endpoints
router.post("/send-otp", otpEmailLimiter, otpLimiter, sendOtp);
router.post("/resend-otp", otpLimiter, resendOtp);
router.post("/verify-otp", otpLimiter, verifyOtp);

router.post("/signup", SingupAuth);
router.post("/login", loginEmailLimiter, loginLimiter, LoginAuth);
router.post("/logout", requireAuth, logout);
router.post("/refresh", refesh);
router.get("/me", requireAuth, getUser);

router.patch("/edit", requireAuth, upload.single("profile_picture"), editUser);

export default router;
