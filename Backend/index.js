import express from "express";
import "dotenv/config";
import cors from "cors";
import { getNews } from "./controllers/newsController.js";
import db from "./config/db.js";
import { refesh } from "./controllers/authController.js";
import passport from "passport";
import cookieParser from "cookie-parser";
import userRouter from "./routes/userRoutes.js";
import eventRouter from "./routes/eventRoutes.js";
import scoreRouter from "./routes/scoreRoute.js";

db();

const app = express();
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

import "./config/passport-config.js";

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// User routes
app.use("/api/auth", userRouter);

// Event routes
app.use("/api", eventRouter);

// Score routes
app.use("/api", scoreRouter);

//news route
app.get("/api/news", getNews);

// token refresh route
app.post("/api/refresh", refesh);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.listen(process.env.SERVER_PORT, () => {
  console.log(
    `server is running on http://localhost:${process.env.SERVER_PORT}`,
  );
});
