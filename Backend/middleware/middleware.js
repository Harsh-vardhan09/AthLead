import passport from "passport";

export const requireAuth = passport.authenticate("jwt", { session: false });

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role != "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to perform this action",
    });
  }

  next();
};

export const wrapAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
