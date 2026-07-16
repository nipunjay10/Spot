import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { usersDb } from "../db/usersDb.js";

// This file sets up Passport (our login library) with three pieces:
// 1. A "local strategy" — checks a username/password against the database.
// 2. serializeUser — decides what to store in the session (just the user's id).
// 3. deserializeUser — turns that stored id back into req.user on every request.

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await usersDb.findByUsername(username.toLowerCase());

      // done(error, user) — passing `false` as the user means "login failed"
      if (!user) {
        return done(null, false);
      }

      const passwordMatches = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatches) {
        return done(null, false);
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }),
);

// After a successful login, Passport calls this once to decide what to
// save in the session. We only save the user's id (as a string) — not
// the whole user object — to keep the session small.
passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

// On every request after that, Passport calls this with the id from the
// session and expects the full user back. This becomes req.user.
passport.deserializeUser(async (id, done) => {
  try {
    const user = await usersDb.findById(id);
    done(null, usersDb.sanitize(user));
  } catch (err) {
    done(err);
  }
});

export default passport;
