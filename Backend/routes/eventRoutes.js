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
import {
  requireAdmin,
  requireAuth,
  validateEvent,
} from "../middleware/middleware.js";
import { createEventVal, updateEventVal } from "../utils/zodValidation.js";

const router = Router();

//User event routes
router.get("/events", findAllEvent);

router.get("/my-events", requireAuth, getMyEvents);

router.post("/events/:eventId/register", requireAuth, registerEvent);

router.delete(
  "/events/:eventId/register",
  requireAuth,
  cancelEventRegistration,
);

//Admin event routes
router.post(
  "/events",
  requireAuth,
  requireAdmin,
  validateEvent(createEventVal),
  createEvent,
);

router.delete("/events/:eventId", requireAuth, requireAdmin, deleteEvent);

router.patch(
  "/events/:eventId",
  requireAuth,
  requireAdmin,
  validateEvent(updateEventVal),
  updateEvent,
);

export default router;
