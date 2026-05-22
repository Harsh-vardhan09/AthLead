import { Router } from "express";
import {
  LoginAuth,
  logout,
  SingupAuth,
} from "../controllers/authController.js";

const router = Router();

router.post("/signup", SingupAuth);
router.post("/login", LoginAuth);
router.post("/logout", logout);

export default router;
