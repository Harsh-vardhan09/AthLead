import { Router } from "express";
import {
  createEvent,
  deleteEvent,
  findAllEvent,
  getMyEvents,
  registerEvent,
  updateEvent,
  cancelEventRegistration,
} from "../controllers/eventController.js";
import { requireAdmin, validateEvent } from "../middleware/middleware.js";
import { createEventVal, updateEventVal } from "../utils/zodValidation.js";
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

router.delete(
  "/events/:eventId/register",
  passport.authenticate("jwt", { session: false }),
  cancelEventRegistration,
);

//Admin event routes
router.post(
  "/events",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  validateEvent(createEventVal),
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
  validateEvent(updateEventVal),
  updateEvent,
);

export default router;
