import { Router } from "express";
import { requireAuth } from "../middleware/middleware.js";
import {
  saveScoreInput,
  getScoreInput,
} from "../controllers/scoreInputController.js";

const router = Router();

router.post("/score-inputs", requireAuth, saveScoreInput);
router.get("/score-inputs", requireAuth, getScoreInput);

export default router;
