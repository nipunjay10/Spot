import express from "express";
import { evaluatePact } from "./pactClearing.js";
import { pactsDb } from "../db/pactsDb.js";
import { usersDb } from "../db/usersDb.js";
import { requireValidId } from "../middleware/requireValidId.js";

const router = express.Router();

// checks that the logged-in user is one of the two partners on a pact
function isMember(pact, userId) {
  return (
    pact.partnerA.toString() === userId || pact.partnerB.toString() === userId
  );
}

// CREATE a new pact with a partner
router.post("/", async (req, res) => {
  try {
    const { partnerId, weeklyTarget } = req.body;
    const myId = req.user._id.toString();

    // weeklyTarget is how many workouts per week both partners commit to, 1-7
    if (
      !Number.isInteger(weeklyTarget) ||
      weeklyTarget < 1 ||
      weeklyTarget > 7
    ) {
      return res
        .status(400)
        .json({ error: "weeklyTarget must be a number from 1 to 7" });
    }
    // you can't be your own accountability partner
    if (partnerId === myId) {
      return res
        .status(400)
        .json({ error: "Cannot form a pact with yourself" });
    }

    // make sure the partner is a real, existing user
    const partner = await usersDb.findById(partnerId);
    if (!partner) {
      return res.status(400).json({ error: "Partner not found" });
    }

    // don't let the same two people form a second pact with each other
    const existingPact = await pactsDb.findBetween(myId, partnerId);
    if (existingPact) {
      return res
        .status(409)
        .json({ error: "A pact already exists between these two users" });
    }

    // the logged-in user is always partnerA, the person they invited is partnerB
    const newPact = await pactsDb.create({
      partnerA: req.user._id,
      partnerB: partner._id,
      weeklyTarget,
      currentStreak: 0,
      createdAt: new Date(),
    });

    res.status(201).json(newPact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ all pacts the logged-in user is part of, each with the partner's profile attached
router.get("/", async (req, res) => {
  try {
    const myId = req.user._id.toString();
    const pacts = await pactsDb.findByUser(myId);

    // for each pact, figure out which side is "me" and attach the OTHER
    // person's profile so the frontend can show "you + your partner"
    const pactsWithPartner = await Promise.all(
      pacts.map(async (pact) => {
        const partnerId =
          pact.partnerA.toString() === myId ? pact.partnerB : pact.partnerA;
        const partner = await usersDb.findById(partnerId);
        return { ...pact, partner: usersDb.sanitize(partner) };
      }),
    );

    res.json(pactsWithPartner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ one pact, with both partners' profiles attached
router.get("/:id", requireValidId, async (req, res) => {
  try {
    const pact = await pactsDb.findById(req.objectId);
    if (!pact) return res.status(404).json({ error: "Pact not found" });

    // only the two people in the pact are allowed to view it
    const myId = req.user._id.toString();
    if (!isMember(pact, myId)) {
      return res.status(403).json({ error: "Not a member of this pact" });
    }

    // fetch both profiles at once so the detail page can show both names
    const [partnerA, partnerB] = await Promise.all([
      usersDb.findById(pact.partnerA),
      usersDb.findById(pact.partnerB),
    ]);

    res.json({
      ...pact,
      partnerA: usersDb.sanitize(partnerA),
      partnerB: usersDb.sanitize(partnerB),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE a pact's weekly target
router.put("/:id", requireValidId, async (req, res) => {
  try {
    const pact = await pactsDb.findById(req.objectId);
    if (!pact) return res.status(404).json({ error: "Pact not found" });

    // only the two partners can change the pact's target
    const myId = req.user._id.toString();
    if (!isMember(pact, myId)) {
      return res.status(403).json({ error: "Not a member of this pact" });
    }

    // weeklyTarget is the only field a pact allows editing
    const { weeklyTarget } = req.body;
    if (
      !Number.isInteger(weeklyTarget) ||
      weeklyTarget < 1 ||
      weeklyTarget > 7
    ) {
      return res
        .status(400)
        .json({ error: "weeklyTarget must be a number from 1 to 7" });
    }

    const updatedPact = await pactsDb.updateTarget(req.objectId, weeklyTarget);
    res.json(updatedPact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE (dissolve) a pact
router.delete("/:id", requireValidId, async (req, res) => {
  try {
    const pact = await pactsDb.findById(req.objectId);
    if (!pact) return res.status(404).json({ error: "Pact not found" });

    // only the two partners can dissolve their own pact
    const myId = req.user._id.toString();
    if (!isMember(pact, myId)) {
      return res.status(403).json({ error: "Not a member of this pact" });
    }

    // dissolving is a hard delete — there's no "dissolved" status to track
    await pactsDb.remove(req.objectId);
    res.json({ message: "Pact dissolved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manually trigger evaluation of a pact (later this could run on a schedule)
router.post("/:id/evaluate", requireValidId, async (req, res) => {
  try {
    const pact = await pactsDb.findById(req.objectId);
    if (!pact) return res.status(404).json({ error: "Pact not found" });

    // only the two partners being evaluated can trigger their own check
    const myId = req.user._id.toString();
    if (!isMember(pact, myId)) {
      return res.status(403).json({ error: "Not a member of this pact" });
    }

    // the actual streak/PR logic lives in pactClearing.js — we just guard it here
    const result = await evaluatePact(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
