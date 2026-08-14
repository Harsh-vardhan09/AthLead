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
import passport from "passport";
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
  keyGenerator: (req) => (req.body.email ?? "").toLowerCase().trim(),
  message: { error: "Too many OTP requests for this address. Try again later." },
});

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

const router = Router();

// OTP endpoints
router.post("/send-otp", otpEmailLimiter, otpLimiter, sendOtp);
router.post("/resend-otp", otpLimiter, resendOtp);
router.post("/verify-otp", otpLimiter, verifyOtp);

router.post("/signup", SingupAuth);
router.post("/login", LoginAuth);
router.post(
  "/logout",
  passport.authenticate("jwt", { session: false }),
  logout,
);
router.post("/refresh", refesh);
router.get("/me", passport.authenticate("jwt", { session: false }), getUser);

router.patch(
  "/edit",
  passport.authenticate("jwt", { session: false }),
  upload.single("profile_picture"),
  editUser,
);

export default router;
