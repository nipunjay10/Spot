import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import { mondayOf, addDays } from "../lib/streak.js";
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// How many weeks of streak each pact should end up with, in the same order
// loadPacts.js pairs its partners up. 0 means the most recent finished week
// was missed, so that pact shows a broken streak.
const STREAK_PLAN = [6, 3, 0, 4, 1, 0, 5, 2, 3, 0, 4];

// Sessions the top-up pass invents, so a demo has streaks worth looking at.
// The 1000 raw records average under one session per user per week, which is
// below every weekly target, so on their own no pact ever clears a week.
// Also reports the weeks that have to be cleared of raw sessions first: a
// stray raw session in a break week would push it back up to target and let
// the streak run on past where it's meant to stop.
function buildStreakSessions(sortedIds, today) {
  const sessions = [];
  const breakWeeks = [];
  const thisWeek = mondayOf(today);

  for (
    let i = 0, pactIndex = 0;
    i + 1 < sortedIds.length;
    i += 2, pactIndex++
  ) {
    // must match loadPacts.js, or the sessions land on the wrong partners
    const weeklyTarget = 2 + (pactIndex % 3);
    const streakWeeks = STREAK_PLAN[pactIndex % STREAK_PLAN.length];
    const partners = [sortedIds[i], sortedIds[i + 1]];
    const breakWeek = addDays(thisWeek, -7 * (streakWeeks + 1));

    for (const userId of partners) {
      // the week in progress: partway to target, so the card has something
      // to show without the streak being able to count it yet
      addWeek(sessions, userId, thisWeek, Math.max(1, weeklyTarget - 1));

      // finished weeks, walking backwards from the most recent one
      for (let w = 1; w <= streakWeeks; w++) {
        addWeek(sessions, userId, addDays(thisWeek, -7 * w), weeklyTarget);
      }

      // the week that broke the streak — one short of target, so the walk
      // stops here instead of running back into the sparse raw data
      addWeek(sessions, userId, breakWeek, weeklyTarget - 1);
      breakWeeks.push({ userId, weekStart: breakWeek });
    }
  }

  return { sessions, breakWeeks };
}

// One session per day starting on the given Monday. Days never repeat, which
// keeps this in line with the one-session-per-day rule the API enforces.
function addWeek(sessions, userId, weekStart, count) {
  for (let day = 0; day < count; day++) {
    sessions.push({
      userId: new ObjectId(userId),
      date: addDays(weekStart, day),
      exercises: [{ name: "Back Squat", sets: 5, reps: 5, weight: 185 }],
      notes: "",
      createdAt: new Date(),
    });
  }
}

// Mark personal records on the seed data. For each user, walk their sessions
// oldest-first: a set is a PR the first time its weight beats their running
// best for that exercise name. Mirrors the API — cross-session best plus at
// most one PR per exercise name per workout. Mutates the sessions in place.
function flagSeedPRs(sessions) {
  // group every session by the user it belongs to
  const byUser = {};
  for (const s of sessions) {
    const key = s.userId.toString();
    if (!byUser[key]) byUser[key] = [];
    byUser[key].push(s);
  }

  for (const userSessions of Object.values(byUser)) {
    // oldest first, so a running best builds up as we go
    userSessions.sort((a, b) => a.date.localeCompare(b.date));
    const bestByName = {};
    for (const s of userSessions) {
      // pick the single heaviest set per name that also beats history
      const prIndexByName = {};
      s.exercises.forEach((ex, i) => {
        const prevBest = bestByName[ex.name] || 0;
        if (ex.weight > prevBest) {
          const cur = prIndexByName[ex.name];
          if (cur === undefined || ex.weight > s.exercises[cur].weight) {
            prIndexByName[ex.name] = i;
          }
        }
      });
      const keep = new Set(Object.values(prIndexByName));
      s.exercises = s.exercises.map((ex, i) => ({ ...ex, isPR: keep.has(i) }));
      // advance each name's running best only after this session is resolved
      for (const ex of s.exercises) {
        bestByName[ex.name] = Math.max(bestByName[ex.name] || 0, ex.weight);
      }
    }
  }
}

async function loadSessions() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db("spot");

  const rawData = JSON.parse(
    fs.readFileSync(path.join(__dirname, "data", "sessions_raw.json"), "utf-8"),
  );

  const sessions = rawData.map((row) => ({
    userId: new ObjectId(row.userId),
    date: row.date,
    exercises: [
      {
        name: row.exerciseName,
        sets: row.sets,
        reps: row.reps,
        weight: row.weight,
      },
    ],
    notes: row.notes,
    createdAt: new Date(),
  }));

  // Second pass: top up recent weeks so the pacts have real streaks to show.
  const challengesRaw = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "data", "challenges_raw.json"),
      "utf-8",
    ),
  );
  const idSet = new Set();
  for (const row of rawData) idSet.add(row.userId);
  for (const row of challengesRaw) {
    idSet.add(row.creatorId);
    if (row.accepterId) idSet.add(row.accepterId);
  }
  const sortedIds = [...idSet].sort();
  const today = new Date().toISOString().slice(0, 10);
  const { sessions: streakSessions, breakWeeks } = buildStreakSessions(
    sortedIds,
    today,
  );

  // clear the raw data out of each break week, so the only sessions there are
  // the ones written on purpose and the week lands short of target for sure
  const cleared = new Set();
  for (const { userId, weekStart } of breakWeeks) {
    for (let day = 0; day < 7; day++) {
      cleared.add(`${userId}:${addDays(weekStart, day)}`);
    }
  }
  const keptRaw = sessions.filter(
    (s) => !cleared.has(`${s.userId.toString()}:${s.date}`),
  );

  // a generated session can land on a day the raw data already used, and the
  // API allows only one session per user per day — drop those duplicates
  const takenDays = new Set(
    keptRaw.map((s) => `${s.userId.toString()}:${s.date}`),
  );
  const newSessions = streakSessions.filter((s) => {
    const key = `${s.userId.toString()}:${s.date}`;
    if (takenDays.has(key)) return false;
    takenDays.add(key);
    return true;
  });

  const allSessions = [...keptRaw, ...newSessions];

  // work out PR badges across each user's full history before inserting
  flagSeedPRs(allSessions);

  await db.collection("sessions").deleteMany({});
  const result = await db.collection("sessions").insertMany(allSessions);
  console.log(
    `Inserted ${result.insertedCount} sessions (${keptRaw.length} of ${sessions.length} from the raw data, ${newSessions.length} generated for pact streaks)`,
  );

  await client.close();
}

loadSessions().catch(console.error);
