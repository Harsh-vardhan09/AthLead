import { Router } from "express";
import {
  getAthletes,
  getAthleteById,
} from "../controllers/athleteController.js";

const router = Router();

router.get("/athletes", getAthletes);
router.get("/athletes/:id", getAthleteById);
router.get("/admin/athletes", getAthletes);
router.get("/admin/athletes/:id", getAthleteById);

export default router;
