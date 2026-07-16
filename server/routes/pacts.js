// TEMP ROUTE FILE FOR TESTING PURPOSES ONLY - KHUSH WILL CHANGE 


import express from 'express';
const router = express.Router();
import { evaluatePact } from './pactClearing.js';

// Manually trigger evaluation of a pact (later this could run on a schedule)
router.post('/:id/evaluate', async (req, res) => {
  try {
    const result = await evaluatePact(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;