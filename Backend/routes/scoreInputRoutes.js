import { Router } from "express";
import passport from "passport";
import {
  saveScoreInput,
  getScoreInput,
} from "../controllers/scoreInputController.js";

const router = Router();

router.post(
  "/score-inputs",
  passport.authenticate("jwt", { session: false }),
  saveScoreInput,
);
router.get(
  "/score-inputs",
  passport.authenticate("jwt", { session: false }),
  getScoreInput,
);

export default router;
