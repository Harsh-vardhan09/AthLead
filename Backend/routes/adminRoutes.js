import { Router } from "express";
import {
  getAthletes,
  getAthleteById,
} from "../controllers/adminController.js";
import { requireAuth, requireAdmin } from "../middleware/middleware.js";

const router = Router();

// Route-level authentication and authorization for admin endpoints
router.use(requireAuth, requireAdmin);

router.get("/athletes", getAthletes);
router.get("/athletes/:id", getAthleteById);
router.get("/admin/athletes", getAthletes);
router.get("/admin/athletes/:id", getAthleteById);

export default router;
