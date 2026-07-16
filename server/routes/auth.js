import express from "express";
import bcrypt from "bcryptjs";
import passport from "../auth/passport.js";
import { usersDb } from "../db/usersDb.js";

/*
  auth.js
  - Express router handling authentication-related endpoints for the Spot app.
  - Provides registration, login, logout, and current-user retrieval routes.
  - Uses Passport for session-based authentication and usersDb for user storage.
  - Passwords are hashed with bcrypt before creating users.
*/

const router = express.Router();

// REGISTER a new user, then log them in automatically
router.post("/register", async (req, res) => {
  try {
    // extract required fields from request body
    const { username, email, password, displayName } = req.body;

    // validate presence of required fields
    if (!username || !email || !password || !displayName) {
      return res.status(400).json({ error: "All fields are required" });
    }
    // enforce minimum password length
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    // normalize username to lowercase for uniqueness checks
    const lowerUsername = username.toLowerCase();

    // check if username already exists
    const existingUsername = await usersDb.findByUsername(lowerUsername);
    if (existingUsername) {
      return res.status(409).json({ error: "Username is already taken" });
    }
    // check if email already exists
    const existingEmail = await usersDb.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ error: "Email is already taken" });
    }

    // hash the plain-text password before storing
    const passwordHash = await bcrypt.hash(password, 10);

    // create new user record in database
    const newUser = await usersDb.create({
      username: lowerUsername,
      email,
      passwordHash,
      displayName,
      bio: "",
      favoriteGym: "",
      createdAt: new Date(),
    });

    // req.login() is provided by Passport — it logs the new user in
    // right away, the same way a normal login would, so they don't
    // have to register then separately log in.
    // call req.login to establish a session for the new user
    req.login(newUser, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      // respond with sanitized user object
      res.status(201).json(usersDb.sanitize(newUser));
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN an existing user
router.post("/login", (req, res, next) => {
  // authenticate using Passport's local strategy
  passport.authenticate("local", (err, user) => {
    // handle internal error from strategy
    if (err) return next(err);
    // if authentication failed, respond with 401
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    // establish a session for the authenticated user
    req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      // return sanitized user profile
      res.json(usersDb.sanitize(user));
    });
  })(req, res, next);
});

// LOGOUT the current user
router.post("/logout", (req, res) => {
  // req.logout() is provided by Passport — it removes the user from the session
  // call logout to remove user from req and clear passport session
  req.logout((err) => {
    if (err) return res.status(500).json({ error: err.message });
    // destroy server-side session so client cookie is invalidated
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });
});

// GET the currently logged-in user
router.get("/me", (req, res) => {
  // this route is used by the frontend to check if the user is logged in and get their profile
  // req.isAuthenticated() is provided by Passport — it returns true if the user is logged in
  // if there's no authenticated user, return 401
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not logged in" });
  }
  // return the current user attached to the request
  res.json(req.user);
});

export default router;
