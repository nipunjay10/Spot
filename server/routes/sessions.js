const express = require('express');
const router = express.Router();
const { connectDB } = require('../db/connection');
const { ObjectId } = require('mongodb');

// CRUD operations for sessions


// READ all sessions for a user
router.get('/', async (req, res) => {
  try {
    const db = await connectDB();
    const userId = req.query.userId;
    const sessions = await db
      .collection('sessions')
      .find({ userId: new ObjectId(userId) })
      .sort({ date: -1 })
      .toArray();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ one session by id (useful for an edit form)
router.get('/:id', async (req, res) => {
  try {
    const db = await connectDB();
    const session = await db
      .collection('sessions')
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE a session
router.put('/:id', async (req, res) => {
  try {
    const db = await connectDB();
    const updates = {
      date: req.body.date,
      exercises: req.body.exercises,
      notes: req.body.notes || '',
    };
    const result = await db
      .collection('sessions')
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: updates });
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ _id: req.params.id, ...updates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a session
router.delete('/:id', async (req, res) => {
  try {
    const db = await connectDB();
    const result = await db
      .collection('sessions')
      .deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE a session with PR check
router.post('/', async (req, res) => {
  try {
    const db = await connectDB();
    const userId = new ObjectId(req.body.userId);
    const exercises = req.body.exercises;

    // Check each exercise against history BEFORE inserting the new session
    const exercisesWithPRFlag = await Promise.all(
      exercises.map(async (ex) => {
        const priorBest = await db.collection('sessions')
          .aggregate([
            { $match: { userId: userId } },
            { $unwind: '$exercises' },
            { $match: { 'exercises.name': ex.name } },
            { $sort: { 'exercises.weight': -1 } },
            { $limit: 1 },
          ])
          .toArray();

        const previousMax = priorBest.length > 0 ? priorBest[0].exercises.weight : 0;
        return { ...ex, isPR: ex.weight > previousMax };
      })
    );

    const session = {
      userId,
      date: req.body.date,
      exercises: exercisesWithPRFlag,
      notes: req.body.notes || '',
      createdAt: new Date(),
    };
    const result = await db.collection('sessions').insertOne(session);
    res.status(201).json({ _id: result.insertedId, ...session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;