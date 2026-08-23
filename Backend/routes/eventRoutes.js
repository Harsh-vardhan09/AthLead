import { Router } from "express";
import {
  createEvent,
  deleteEvent,
  findAllEvent,
  getMyEvents,
  registerEvent,
  updateEvent,
} from "../controllers/eventController.js";
import { requireAdmin } from "../middleware/middleware.js";
import passport from "passport";

const router = Router();

//User event routes
router.get("/events", findAllEvent);

router.get(
  "/my-events",
  passport.authenticate("jwt", { session: false }),
  getMyEvents,
);

router.post(
  "/events/:eventId/register",
  passport.authenticate("jwt", { session: false }),
  registerEvent,
);

//Admin event routes
router.post(
  "/events",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  createEvent,
);

router.delete(
  "/events/:eventId",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  deleteEvent,
);

router.patch(
  "/events/:eventId",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  updateEvent,
);

export default router;
