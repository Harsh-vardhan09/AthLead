import passport from "passport";
import { User } from "../models/Users.js";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";

let opts = {};

opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWT_SECRET;

passport.use(
  new JwtStrategy(opts, async function (jwt_payload, done) {
    try {
       const user= await User.findOne({ _id: jwt_payload.id })
          if (user) {
            return done(null, user);
          } else {
            return done(null, false);
            // or you could create a new account
          }
    } catch (error) {
        return done(error, false); 
    }
  }),
);
