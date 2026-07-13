const { connectDB } = require('../db/connection');
const { ObjectId } = require('mongodb');

// Returns the Monday and Sunday of the current week as ISO date strings
function getCurrentWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

// Counts a user's sessions within a date range (inclusive)
async function countSessionsInRange(db, userId, start, end) {
  return db.collection('sessions').countDocuments({
    userId: new ObjectId(userId),
    date: { $gte: start, $lte: end },
  });
}

// Checks one pact against this week's sessions, updates the streak, returns the result
async function evaluatePact(pactId) {
  const db = await connectDB();
  const pact = await db.collection('pacts').findOne({ _id: new ObjectId(pactId) });
  if (!pact) throw new Error('Pact not found');

  const { start, end } = getCurrentWeekRange();

  const [countA, countB] = await Promise.all([
    countSessionsInRange(db, pact.partnerA, start, end),
    countSessionsInRange(db, pact.partnerB, start, end),
  ]);

  const bothHitTarget = countA >= pact.weeklyTarget && countB >= pact.weeklyTarget;
  const newStreak = bothHitTarget ? pact.currentStreak + 1 : 0;

  await db.collection('pacts').updateOne(
    { _id: new ObjectId(pactId) },
    { $set: { currentStreak: newStreak } }
  );

  return { pactId, countA, countB, weeklyTarget: pact.weeklyTarget, streak: newStreak, cleared: bothHitTarget };
}

module.exports = { evaluatePact, getCurrentWeekRange };