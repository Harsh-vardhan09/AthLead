import { Router } from "express";
import { getRanking, getScore, setScore } from "../controllers/scoreController";

const router = Router();

router.get(
  "/score/rank",
  passport.authenticate("jwt", { session: false }),
  getRanking,
);

router.post("/score", passport.authenticate("jwt", { session: false }), setScore);
router.get(
  "/my-scores",
  passport.authenticate("jwt", { session: false }),
  getScore,
);

export default router;
