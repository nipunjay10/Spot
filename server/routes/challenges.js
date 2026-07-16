import express from 'express';
const router = express.Router();
import { connectDB } from '../db/connection.js';
import { ObjectId } from 'mongodb';

// CRUD operations for challenges


// CREATE a challenge
router.post('/', async (req, res) => {
  try {
    const db = await connectDB();
    const challenge = {
      creatorId: new ObjectId(req.body.creatorId),
      accepterId: null,
      description: req.body.description,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      status: 'open',
      proofEntries: [],
      createdAt: new Date(),
    };
    const result = await db.collection('challenges').insertOne(challenge);
    res.status(201).json({ _id: result.insertedId, ...challenge });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ all open challenges (the public feed)
router.get('/', async (req, res) => {
  try {
    const db = await connectDB();
    const status = req.query.status; // optional filter, e.g. ?status=open
    const filter = status ? { status } : {};
    const challenges = await db
      .collection('challenges')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();
    res.json(challenges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ACCEPT a challenge
router.put('/:id/accept', async (req, res) => {
  try {
    const db = await connectDB();
    const challenge = await db.collection('challenges')
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (challenge.status !== 'open') {
      return res.status(400).json({ error: 'Challenge is not open' });
    }

    await db.collection('challenges').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { accepterId: new ObjectId(req.body.accepterId), status: 'accepted' } }
    );
    res.json({ message: 'Challenge accepted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOG a proof entry
router.post('/:id/proof', async (req, res) => {
  try {
    const db = await connectDB();
    const challenge = await db.collection('challenges')
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (challenge.status !== 'accepted') {
      return res.status(400).json({ error: 'Challenge must be accepted first' });
    }

    const newEntry = {
      date: req.body.date,
      completed: req.body.completed,
      notes: req.body.notes || '',
    };

    const updatedEntries = [...challenge.proofEntries, newEntry];

    // If today's entry is for the final day of the window, resolve the challenge
    let newStatus = challenge.status;
    if (req.body.date === challenge.endDate) {
      const allCompleted = updatedEntries.every((entry) => entry.completed);
      newStatus = allCompleted ? 'completed' : 'failed';
    } else if (!req.body.completed) {
      // missing a day early fails it immediately — no point continuing
      newStatus = 'failed';
    }

    await db.collection('challenges').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { proofEntries: updatedEntries, status: newStatus } }
    );

    res.json({ proofEntries: updatedEntries, status: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a challenge
router.delete('/:id', async (req, res) => {
  try {
    const db = await connectDB();
    const result = await db
      .collection('challenges')
      .deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    res.json({ message: 'Challenge deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;