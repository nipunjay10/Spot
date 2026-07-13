// TEMP ROUTE FILE FOR TESTING PURPOSES ONLY - KHUSH WILL CHANGE 


const express = require('express');
const router = express.Router();
const { evaluatePact } = require('./pactClearing');

// Manually trigger evaluation of a pact (later this could run on a schedule)
router.post('/:id/evaluate', async (req, res) => {
  try {
    const result = await evaluatePact(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;