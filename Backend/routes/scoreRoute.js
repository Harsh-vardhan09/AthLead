import { Router } from "express";
import {
  getRanking,
  getScore,
  setScore,
} from "../controllers/scoreController.js";
import { requireAuth } from "../middleware/middleware.js";
import { predictionLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.get("/score/rank", requireAuth, getRanking);

router.post("/score", requireAuth, predictionLimiter, setScore);
router.get("/my-scores", requireAuth, getScore);

export default router;
