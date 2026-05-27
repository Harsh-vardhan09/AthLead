import { Router } from "express";
import {
  LoginAuth,
  logout,
  SingupAuth,
  getUser,
} from "../controllers/authController.js";
import passport from "passport";

const router = Router();

router.post("/signup", SingupAuth);
router.post("/login", LoginAuth);
router.post("/logout", logout);
router.get("/me", passport.authenticate("jwt", { session: false }), getUser);

export default router;