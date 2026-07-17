import express from "express";
const router = express.Router();
import { connectDB } from "../db/connection.js";
import { ObjectId } from "mongodb";
import { ensureAuthenticated } from "../middleware/ensureAuthenticated.js";

// CRUD operations for sessions

// heaviest weight this user has ever done for an exercise name.
// excludeId skips one session (used when editing, so a session isn't
// compared against itself). Returns 0 if there's no prior record.
async function priorBestWeight(db, userId, name, excludeId = null) {
  // only look at this user's sessions, optionally skipping the one being edited
  const match = { userId };
  if (excludeId) match._id = { $ne: excludeId };
  const rows = await db
    .collection("sessions")
    .aggregate([
      { $match: match },
      { $unwind: "$exercises" },
      { $match: { "exercises.name": name } },
      { $sort: { "exercises.weight": -1 } },
      { $limit: 1 },
    ])
    .toArray();
  return rows.length > 0 ? rows[0].exercises.weight : 0;
}

// READ all sessions for a user
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const db = await connectDB();
    const sessions = await db
      .collection("sessions")
      .find({ userId: req.user._id })
      .sort({ date: -1 })
      .toArray();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ one session by id (useful for an edit form)
router.get("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const db = await connectDB();
    const session = await db
      .collection("sessions")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!session) return res.status(404).json({ error: "Session not found" });
    // a session is private, so only the user who logged it can read it
    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not your session" });
    }
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE a session
router.put("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const db = await connectDB();
    const existing = await db
      .collection("sessions")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!existing) return res.status(404).json({ error: "Session not found" });
    // only the user who logged the session can edit it
    if (existing.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not your session" });
    }

    // isPR is earned on the server, so never trust the copy the client sends back.
    // recompute each exercise against the user's history, excluding this session
    // so an edited exercise isn't compared against its own old weight
    const incoming = req.body.exercises || [];
    const exercises = await Promise.all(
      incoming.map(async (ex) => {
        const previousMax = await priorBestWeight(
          db,
          existing.userId,
          ex.name,
          existing._id,
        );
        return {
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          isPR: ex.weight > previousMax,
        };
      }),
    );

    const updates = {
      date: req.body.date,
      exercises: exercises,
      notes: req.body.notes || "",
    };
    await db
      .collection("sessions")
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: updates });
    res.json({ _id: req.params.id, ...updates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a session
router.delete("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const db = await connectDB();
    const existing = await db
      .collection("sessions")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!existing) return res.status(404).json({ error: "Session not found" });
    // only the user who logged the session can delete it
    if (existing.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not your session" });
    }

    await db
      .collection("sessions")
      .deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: "Session deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE a session with PR check
router.post("/", ensureAuthenticated, async (req, res) => {
  try {
    const db = await connectDB();
    const userId = req.user._id;
    const exercises = req.body.exercises;

    // one session per day keeps the history readable
    const clash = await db
      .collection("sessions")
      .findOne({ userId: userId, date: req.body.date });
    if (clash) {
      return res
        .status(400)
        .json({ error: "You already logged a workout on that date" });
    }

    // Check each exercise against history BEFORE inserting the new session
    const exercisesWithPRFlag = await Promise.all(
      exercises.map(async (ex) => {
        const previousMax = await priorBestWeight(db, userId, ex.name);
        return { ...ex, isPR: ex.weight > previousMax };
      }),
    );

    const session = {
      userId,
      date: req.body.date,
      exercises: exercisesWithPRFlag,
      notes: req.body.notes || "",
      createdAt: new Date(),
    };
    const result = await db.collection("sessions").insertOne(session);
    res.status(201).json({ _id: result.insertedId, ...session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
