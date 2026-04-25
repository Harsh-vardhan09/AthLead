import passport from "passport";

export const requireAuth=passport.authenticate('jwt',{session:false})

export const wrapAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};