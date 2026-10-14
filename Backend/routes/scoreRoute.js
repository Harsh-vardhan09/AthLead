import { Router } from "express";
import {
  getRanking,
  getScore,
  setScore,
} from "../controllers/scoreController.js";
import passport from "passport";
import { predictionLimiter, readLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.get(
  "/score/rank",
  passport.authenticate("jwt", { session: false }),
  readLimiter,
  getRanking,
);

router.post(
  "/score",
  passport.authenticate("jwt", { session: false }),
  predictionLimiter,
  setScore,
);
router.get(
  "/my-scores",
  passport.authenticate("jwt", { session: false }),
  readLimiter,
  getScore,
);

export default router;
