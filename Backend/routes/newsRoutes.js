import express from "express";
import { getNews } from "../controllers/newsController.js";

const router = express.Router();

// Route to fetch ministry announcements and sports news
router.get("/", getNews);

export default router;
