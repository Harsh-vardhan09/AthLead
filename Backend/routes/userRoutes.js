import { Router } from "express";
import {
  LoginAuth,
  logout,
  getUser,
  editUser,
  refesh,
} from "../controllers/authController.js";
import { sendOtp, resendOtp, verifyOtp, SingupAuth } from "../controllers/OtpController.js";
import passport from "passport";
import multer from "multer";

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
router.post("/send-otp",   sendOtp);
router.post("/resend-otp", resendOtp);
router.post("/verify-otp", verifyOtp);

router.post("/signup", SingupAuth);
router.post("/login", LoginAuth);
router.post("/logout", logout);
router.post("/refresh", refesh);
router.get("/me", passport.authenticate("jwt", { session: false }), getUser);
router.patch(
  "/edit",
  passport.authenticate("jwt", { session: false }),
  upload.single("profile_picture"),
  editUser,
);

export default router;