import { ZodError } from "zod";

const GENERIC_MESSAGE = "Internal server error";

const isDevelopment = () => process.env.NODE_ENV === "development";

const mapKnownError = (err) => {
  if (err instanceof ZodError) {
    return {
      status: 400,
      message: "Validation failed",
      errors: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    };
  }

  switch (err.name) {
    case "MulterError":
      return { status: 400, message: err.message };
    case "TokenExpiredError":
      return { status: 401, message: "Token expired" };
    case "JsonWebTokenError":
    case "NotBeforeError":
      return { status: 401, message: "Invalid token" };
    case "ValidationError":
      return {
        status: 400,
        message: "Validation failed",
        errors: Object.values(err.errors ?? {}).map((e) => ({
          path: e.path,
          message: e.message,
        })),
      };
    case "CastError":
      return { status: 400, message: `Invalid value for ${err.path}` };
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0];
    return {
      status: 409,
      message: field ? `${field} already exists` : "Duplicate value",
    };
  }

  if (err.type === "entity.parse.failed") {
    return { status: 400, message: "Malformed request body" };
  }
  if (err.type === "entity.too.large") {
    return { status: 413, message: "Request body too large" };
  }

  return null;
};

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const error = err ?? new Error(GENERIC_MESSAGE);
  const known = mapKnownError(error);

  const candidate = error.status ?? error.statusCode;
  const status =
    known?.status ??
    (Number.isInteger(candidate) && candidate >= 400 && candidate < 600
      ? candidate
      : 500);

  if (status >= 500) console.error(error);

  const body = { success: false };
  if (status >= 500) {
    body.message = isDevelopment()
      ? error.message || GENERIC_MESSAGE
      : GENERIC_MESSAGE;
  } else {
    body.message = known?.message ?? (error.message || GENERIC_MESSAGE);
  }
  if (known?.errors) body.errors = known.errors;
  if (isDevelopment()) body.stack = error.stack;

  return res.status(status).json(body);
};
