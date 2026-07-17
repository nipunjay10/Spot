import express from "express";
const router = express.Router();
import { connectDB } from "../db/connection.js";
import { ObjectId } from "mongodb";
import { ensureAuthenticated } from "../middleware/ensureAuthenticated.js";

// CRUD operations for challenges

// CREATE a challenge
router.post("/", ensureAuthenticated, async (req, res) => {
  try {
    const db = await connectDB();
    const challenge = {
      creatorId: req.user._id,
      accepterId: null,
      description: req.body.description,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      status: "open",
      proofEntries: [],
      createdAt: new Date(),
    };
    const result = await db.collection("challenges").insertOne(challenge);
    res.status(201).json({ _id: result.insertedId, ...challenge });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ all open challenges (the public feed)
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const db = await connectDB();
    const status = req.query.status; // optional filter, e.g. ?status=open
    // only allow known statuses through, so the query can't smuggle in a mongo operator
    const allowed = ["open", "accepted", "completed", "failed"];
    const filter = allowed.includes(status) ? { status: status } : {};
    const challenges = await db
      .collection("challenges")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();
    res.json(challenges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ACCEPT a challenge
router.put("/:id/accept", ensureAuthenticated, async (req, res) => {
  try {
    const db = await connectDB();
    const challenge = await db
      .collection("challenges")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!challenge)
      return res.status(404).json({ error: "Challenge not found" });
    if (challenge.status !== "open") {
      return res.status(400).json({ error: "Challenge is not open" });
    }
    // a challenge needs two people, so the creator cannot take their own
    if (challenge.creatorId.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ error: "You cannot accept your own challenge" });
    }

    await db.collection("challenges").updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          accepterId: req.user._id,
          status: "accepted",
        },
      },
    );
    res.json({ message: "Challenge accepted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOG a proof entry
router.post("/:id/proof", ensureAuthenticated, async (req, res) => {
  try {
    const db = await connectDB();
    const challenge = await db
      .collection("challenges")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!challenge)
      return res.status(404).json({ error: "Challenge not found" });
    if (challenge.status !== "accepted") {
      return res
        .status(400)
        .json({ error: "Challenge must be accepted first" });
    }
    // only the person who accepted the challenge can log proof for it
    if (
      !challenge.accepterId ||
      challenge.accepterId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: "Not your challenge to log" });
    }

    // force a real boolean so the pass/fail check below can't be skewed by a truthy string
    const completed = req.body.completed === true;

    const newEntry = {
      date: req.body.date,
      completed: completed,
      notes: req.body.notes || "",
    };

    const updatedEntries = [...challenge.proofEntries, newEntry];

    // If today's entry is for the final day of the window, resolve the challenge
    let newStatus = challenge.status;
    if (req.body.date === challenge.endDate) {
      const allCompleted = updatedEntries.every((entry) => entry.completed);
      newStatus = allCompleted ? "completed" : "failed";
    } else if (!completed) {
      // missing a day early fails it immediately — no point continuing
      newStatus = "failed";
    }

    await db
      .collection("challenges")
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { proofEntries: updatedEntries, status: newStatus } },
      );

    res.json({ proofEntries: updatedEntries, status: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a challenge
router.delete("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const db = await connectDB();
    const existing = await db
      .collection("challenges")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!existing) {
      return res.status(404).json({ error: "Challenge not found" });
    }
    // only the person who posted the challenge can delete it
    if (existing.creatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not your challenge" });
    }
    // once someone has accepted, deleting would wipe their proof entries too
    if (existing.status !== "open") {
      return res
        .status(400)
        .json({ error: "Cannot delete a challenge someone has accepted" });
    }

    await db
      .collection("challenges")
      .deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: "Challenge deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
