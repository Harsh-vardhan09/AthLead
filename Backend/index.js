import express from "express";
import "dotenv/config";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { getNews } from "./controllers/newsController.js";
import db from "./config/db.js";
import { refesh } from "./controllers/authController.js";
import passport from "passport";
import cookieParser from "cookie-parser";
import userRouter from "./routes/userRoutes.js";
import eventRouter from "./routes/eventRoutes.js";
import scoreRouter from "./routes/scoreRoute.js";
import scoreInputRoutes from "./routes/scoreInputRoutes.js";
import newsRoute from "./routes/newsRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

db();

const app = express();

// Secure HTTP headers
app.use(helmet());

app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json({ limit: "100kb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "100kb",
  }),
);
app.use(passport.initialize());
app.use("/api/news", newsRoute);

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

// Score Input routes
app.use("/api", scoreInputRoutes);

// token refresh route
app.post("/api/refresh", refesh);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

app.listen(process.env.SERVER_PORT, () => {
  console.log(
    `server is running on http://localhost:${process.env.SERVER_PORT}`,
  );
});
