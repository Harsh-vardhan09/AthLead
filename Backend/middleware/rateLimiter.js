import rateLimit from "express-rate-limit";

const toInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const predictionLimiter = rateLimit({
  windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  max: toInt(process.env.RATE_LIMIT_MAX_REQUESTS, 5),
  message: {
    success: false,
    message:
      "Too many prediction requests created from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const readLimiter = rateLimit({
  windowMs: toInt(process.env.RATE_LIMIT_READ_WINDOW_MS, 15 * 60 * 1000),
  max: toInt(process.env.RATE_LIMIT_READ_MAX_REQUESTS, 100),
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
