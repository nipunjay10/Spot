import express from "express";
import { usersDb } from "../db/usersDb.js";
import { requireValidId } from "../middleware/requireValidId.js";

const router = express.Router();

// SEARCH users by username/displayName, for finding a workout partner
router.get("/", async (req, res) => {
  try {
    const term = req.query.search;
    if (!term) {
      return res.json([]);
    }
    const users = await usersDb.search(term, req.user._id);
    res.json(users.map(usersDb.sanitize));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ one user's profile by id
router.get("/:id", requireValidId, async (req, res) => {
  try {
    const user = await usersDb.findById(req.objectId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(usersDb.sanitize(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE a profile — only the logged-in user can edit their own profile
// this update does not enforce uniqueness, so even though a user must create a profile with a unique email/username,
// they can change it to an existing one. I would recommend adding the same checks that the register path has.
router.put("/:id", requireValidId, async (req, res) => {
  try {
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ error: "Cannot edit another user" });
    }

    const updates = {
      displayName: req.body.displayName,
      bio: req.body.bio || "",
      favoriteGym: req.body.favoriteGym || "",
      email: req.body.email,
    };

    const updatedUser = await usersDb.update(req.objectId, updates);
    if (!updatedUser) return res.status(404).json({ error: "User not found" });
    res.json(usersDb.sanitize(updatedUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a user's own account, then log them out
router.delete("/:id", requireValidId, async (req, res) => {
  try {
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ error: "Cannot delete another user" });
    }

    const deleted = await usersDb.remove(req.objectId);
    if (!deleted) return res.status(404).json({ error: "User not found" });

    req.logout((err) => {
      if (err) return res.status(500).json({ error: err.message });
      req.session.destroy(() => {
        res.json({ message: "Account deleted" });
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
