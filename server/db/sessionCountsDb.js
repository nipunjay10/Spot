import { connectDB } from "./connection.js";
import { ObjectId } from "mongodb";
import { mondayOf } from "../lib/streak.js";

// Reads session counts out of the "sessions" collection for the streak math.
// Kept separate from pactsDb because that file only touches "pacts".

// Counts a user's sessions per week, from fromWeek up to the end of toWeek.
// Returns a plain object mapping a week's Monday to that week's count, which
// is the shape streakFrom expects: { "2026-07-06": 3, "2026-06-29": 2 }
async function countByWeek(userId, fromWeek, toWeekEnd) {
  const db = await connectDB();
  const sessions = await db
    .collection("sessions")
    .find(
      {
        userId: new ObjectId(userId),
        date: { $gte: fromWeek, $lte: toWeekEnd },
      },
      // we only need the date to bucket by week
      { projection: { date: 1, _id: 0 } },
    )
    .toArray();

  // bucket in JS rather than in mongo, since the week math lives in streak.js
  const counts = {};
  for (const session of sessions) {
    const week = mondayOf(session.date);
    counts[week] = (counts[week] || 0) + 1;
  }
  return counts;
}

export const sessionCountsDb = { countByWeek };
