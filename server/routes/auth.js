import express from "express";
import bcrypt from "bcryptjs";
import passport from "../auth/passport.js";
import { usersDb } from "../db/usersDb.js";

const router = express.Router();

// REGISTER a new user, then log them in automatically
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    if (!username || !email || !password || !displayName) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const lowerUsername = username.toLowerCase();

    const existingUsername = await usersDb.findByUsername(lowerUsername);
    if (existingUsername) {
      return res.status(409).json({ error: "Username is already taken" });
    }
    const existingEmail = await usersDb.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ error: "Email is already taken" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

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
    req.login(newUser, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json(usersDb.sanitize(newUser));
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN an existing user
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      res.json(usersDb.sanitize(user));
    });
  })(req, res, next);
});

// LOGOUT the current user
router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: err.message });
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });
});

// GET the currently logged-in user
router.get("/me", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not logged in" });
  }
  res.json(req.user);
});

export default router;
