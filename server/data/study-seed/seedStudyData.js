/*
  seedStudyData.js — builds the demo account used in the usability study.

  Run this before every participant session. It creates one demo account
  (spotdemo) with a couple of months of workout history, an active pact with a
  real streak, a pact invite waiting to be accepted, and a set of challenges
  that are open right now.

  Everything this script creates is tagged with studySeed: true, and every run
  deletes the old tagged records before making new ones. That means it is safe
  to run over and over, and it resets the one-shot actions (accepting the pact
  invite, proposing a new pact) that a participant uses up during a session.

  All dates are worked out from the day the script runs, never hardcoded, so
  "this week" is always the real current week no matter which day you run it.

  Usage (from the server/ folder):
    node data/study-seed/seedStudyData.js
    node data/study-seed/seedStudyData.js --clean   (remove seeded data, add nothing)
*/

import bcrypt from "bcryptjs";
import { connectDB } from "../../db/connection.js";
import { mondayOf, addDays } from "../../lib/streak.js";

// the single study account every participant uses. Re-running this script
// before each session puts it back to the same starting point.
const USERNAME = "spotdemo";
const DISPLAY_NAME = "Test Account";
const PASSWORD = "demospot123";

// how many weeks of history each persona gets
const HISTORY_WEEKS = 8;

// every persona trains this many times a week, and their pact asks for less,
// so the streak is comfortably unbroken and the numbers read as "on track"
const SESSIONS_PER_WEEK = 4;
const WEEKLY_TARGET = 3;

// today as YYYY-MM-DD, built from local parts so the date can't slip a day
function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// turns a YYYY-MM-DD string into a Date, at noon so timezones can't shift it
function dateAt(dateStr) {
  return new Date(dateStr + "T12:00:00Z");
}

/*
  The bench press numbers each persona has worked through, oldest first.
  The weight climbs every couple of weeks, so the heaviest one is the answer
  to "what's the heaviest bench press you've ever done?" in task T3.
*/
const BENCH_PROGRESSION = [135, 145, 155, 165, 175, 185, 195, 205];

// the other lifts that fill out a session, so history doesn't look like
// nothing but bench press
const OTHER_LIFTS = [
  { name: "Squat", sets: 4, reps: 6, weights: [185, 205, 225, 245] },
  { name: "Deadlift", sets: 3, reps: 5, weights: [225, 245, 275, 295] },
  { name: "Overhead Press", sets: 3, reps: 8, weights: [75, 85, 95, 105] },
  { name: "Barbell Row", sets: 4, reps: 8, weights: [115, 125, 135, 145] },
];

// notes that get attached to some sessions, to make history feel real
const NOTES = [
  "Felt strong today.",
  "Tired but got through it.",
  "Good session, bar speed was fast.",
  "Shoulder a little tight, kept it light.",
  "",
  "",
];

/*
  Builds one persona's whole workout history.

  Walks week by week from the oldest week up to this week. Each week gets
  SESSIONS_PER_WEEK sessions on spread-out days. Bench press climbs through
  BENCH_PROGRESSION as the weeks go by, and the first time each new weight
  shows up it is a personal record, which is what puts the PR badge on it.
*/
function buildSessions(userId, today) {
  const sessions = [];
  const thisMonday = mondayOf(today);

  // the heaviest weight seen so far for each exercise, so a lift only counts
  // as a PR the first time it beats everything before it — this matches how
  // routes/sessions.js decides isPR when a real user logs a workout
  const bestSoFar = {};

  // start at the oldest week and walk forward to the current one
  for (let weekOffset = HISTORY_WEEKS - 1; weekOffset >= 0; weekOffset--) {
    const weekMonday = addDays(thisMonday, -7 * weekOffset);

    // bench climbs as the weeks pass — later weeks use later entries
    const benchIndex = Math.min(
      BENCH_PROGRESSION.length - 1,
      HISTORY_WEEKS - 1 - weekOffset,
    );
    const benchWeight = BENCH_PROGRESSION[benchIndex];

    // train Monday, Tuesday, Thursday, Saturday
    const trainingDays = [0, 1, 3, 5].slice(0, SESSIONS_PER_WEEK);

    for (let i = 0; i < trainingDays.length; i++) {
      const date = addDays(weekMonday, trainingDays[i]);

      // never log a workout in the future — the current week is only
      // partly done, so stop once we pass today
      if (date > today) continue;

      const exercises = [];

      // bench press goes in the first session of each week
      if (i === 0) {
        const isPR =
          !bestSoFar["Bench Press"] || benchWeight > bestSoFar["Bench Press"];
        if (isPR) bestSoFar["Bench Press"] = benchWeight;
        exercises.push({
          name: "Bench Press",
          sets: 3,
          reps: 5,
          weight: benchWeight,
          isPR,
        });
      }

      // add one other lift, rotating through the list so each session differs
      const lift = OTHER_LIFTS[(weekOffset + i) % OTHER_LIFTS.length];
      const liftWeight =
        lift.weights[
          Math.min(lift.weights.length - 1, benchIndex % lift.weights.length)
        ];
      const liftIsPR =
        !bestSoFar[lift.name] || liftWeight > bestSoFar[lift.name];
      if (liftIsPR) bestSoFar[lift.name] = liftWeight;
      exercises.push({
        name: lift.name,
        sets: lift.sets,
        reps: lift.reps,
        weight: liftWeight,
        isPR: liftIsPR,
      });

      sessions.push({
        userId,
        date,
        exercises,
        notes: NOTES[(weekOffset + i) % NOTES.length],
        createdAt: dateAt(date),
        studySeed: true,
      });
    }
  }

  return sessions;
}

/*
  Builds the pact partner's sessions.

  The partner needs their own history for the streak to work, because a week
  only counts if BOTH people hit the target. The partner trains exactly the
  target number of times each week for the finished weeks, so the streak is
  unbroken, and comes up one short this week so the pact page shows a week
  still in progress rather than one already finished.
*/
function buildPartnerSessions(partnerId, today, weeksBack) {
  const sessions = [];
  const thisMonday = mondayOf(today);

  for (let weekOffset = weeksBack; weekOffset >= 0; weekOffset--) {
    const weekMonday = addDays(thisMonday, -7 * weekOffset);

    // finished weeks get the full target; the current week is left one short
    const count = weekOffset === 0 ? WEEKLY_TARGET - 1 : WEEKLY_TARGET;

    for (let i = 0; i < count; i++) {
      const date = addDays(weekMonday, [0, 2, 4][i]);
      if (date > today) continue;

      sessions.push({
        userId: partnerId,
        date,
        exercises: [
          { name: "Squat", sets: 4, reps: 6, weight: 185, isPR: false },
        ],
        notes: "",
        createdAt: dateAt(date),
        studySeed: true,
      });
    }
  }

  return sessions;
}

// the challenges that need to be open during the study, so there is something
// for a participant to accept in task T6
const CHALLENGE_IDEAS = [
  {
    description: "100 push-ups a day",
    startOffset: -2,
    endOffset: 5,
    targetDays: 4,
  },
  {
    description: "Run 2 miles every day",
    startOffset: -1,
    endOffset: 6,
    targetDays: 5,
  },
  {
    description: "No skipping leg day",
    startOffset: -3,
    endOffset: 4,
    targetDays: 3,
  },
  {
    description: "50 pull-ups a day",
    startOffset: 0,
    endOffset: 7,
    targetDays: 5,
  },
  {
    description: "Stretch 15 minutes daily",
    startOffset: -2,
    endOffset: 8,
    targetDays: 6,
  },
  {
    description: "Plank for 3 minutes a day",
    startOffset: -1,
    endOffset: 5,
    targetDays: 4,
  },
  {
    description: "Walk 10k steps a day",
    startOffset: 0,
    endOffset: 6,
    targetDays: 5,
  },
];

/*
  Removes everything a previous run of this script created.
  Anything tagged studySeed: true is ours; the original seed data has no such
  tag, so this never touches it.
*/
async function cleanStudyData(db) {
  // find the demo account first, so we can clear anything pointing at it —
  // including the pact a participant created during the last session.
  // the pattern also catches older numbered accounts (spotdemo1, spotdemo2...)
  // so none are left behind to show up in partner search.
  const demoAccounts = await db
    .collection("users")
    .find({ username: { $regex: `^${USERNAME}` } })
    .toArray();
  const demoIds = demoAccounts.map((u) => u._id);

  // pacts and sessions can belong to the demo account without carrying the tag
  // themselves (a partner's sessions, or anything a participant made), so
  // clear by owner too
  const results = await Promise.all([
    db.collection("users").deleteMany({ _id: { $in: demoIds } }),
    db.collection("sessions").deleteMany({
      $or: [{ studySeed: true }, { userId: { $in: demoIds } }],
    }),
    db.collection("challenges").deleteMany({
      $or: [{ studySeed: true }, { creatorId: { $in: demoIds } }],
    }),
    db.collection("acceptances").deleteMany({
      $or: [{ studySeed: true }, { userId: { $in: demoIds } }],
    }),
    db.collection("pacts").deleteMany({
      $or: [
        { studySeed: true },
        { partnerA: { $in: demoIds } },
        { partnerB: { $in: demoIds } },
      ],
    }),
  ]);

  return {
    users: results[0].deletedCount,
    sessions: results[1].deletedCount,
    challenges: results[2].deletedCount,
    acceptances: results[3].deletedCount,
    pacts: results[4].deletedCount,
  };
}

async function seed() {
  const db = await connectDB();
  const today = todayString();

  // wipe anything from a previous run before building fresh
  const removed = await cleanStudyData(db);
  console.log(
    `Cleaned previous study data: ${removed.users} users, ${removed.sessions} sessions, ` +
      `${removed.pacts} pacts, ${removed.challenges} challenges, ${removed.acceptances} acceptances`,
  );

  // stop here if we were only asked to clean up
  if (process.argv.includes("--clean")) {
    console.log("Clean-only run — nothing was created.");
    return;
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  /*
    The study needs some existing users to act as pact partners and as the
    people who posted the open challenges. We use accounts from the original
    seed data so partner search still turns up a believable list of people.
  */
  const existingUsers = await db
    .collection("users")
    .find({ username: { $not: { $regex: `^${USERNAME}` } } })
    .toArray();

  if (existingUsers.length < 4) {
    throw new Error(
      "Not enough existing users to build the study data. Restore the database dump first " +
        "(see the README in this folder).",
    );
  }

  // two partners: one already in a pact with the demo account, one who has
  // sent an invite that is still waiting. Everyone else is free to be
  // partnered with, which is what task T5 needs.
  const activePartner = existingUsers[0];
  const invitePartner = existingUsers[1];

  // create the demo account itself
  const inserted = await db.collection("users").insertOne({
    username: USERNAME,
    email: `${USERNAME}@example.com`,
    passwordHash,
    displayName: DISPLAY_NAME,
    bio: "Trying to stay consistent.",
    favoriteGym: "Northeastern Marino Center",
    // joined a bit over two months ago, matching the history below
    createdAt: dateAt(addDays(today, -70)),
    studySeed: true,
  });
  const demoId = inserted.insertedId;

  // the demo account's own workout history, ending in the current week
  const sessions = buildSessions(demoId, today);
  await db.collection("sessions").insertMany(sessions);

  // the active partner needs matching history, or the shared streak is zero
  const partnerSessions = buildPartnerSessions(
    activePartner._id,
    today,
    HISTORY_WEEKS - 1,
  );
  await db.collection("sessions").insertMany(partnerSessions);

  // the active pact — started well before the history does, so every
  // finished week since then counts toward the streak
  await db.collection("pacts").insertOne({
    partnerA: activePartner._id,
    partnerB: demoId,
    weeklyTarget: WEEKLY_TARGET,
    status: "active",
    proposedBy: activePartner._id,
    activatedAt: dateAt(addDays(mondayOf(today), -7 * (HISTORY_WEEKS - 1))),
    createdAt: dateAt(addDays(mondayOf(today), -7 * (HISTORY_WEEKS - 1))),
    studySeed: true,
  });

  // the pact invite waiting for the participant to accept in task T4.
  // proposedBy is the other person, so the demo account sees Accept / Decline.
  await db.collection("pacts").insertOne({
    partnerA: invitePartner._id,
    partnerB: demoId,
    weeklyTarget: 4,
    status: "pending",
    proposedBy: invitePartner._id,
    activatedAt: null,
    createdAt: dateAt(addDays(today, -2)),
    studySeed: true,
  });

  /*
    Challenges that are open right now. They are posted by other users, so the
    demo account sees an Accept button rather than its own challenge.
  */
  const posters = existingUsers.slice(2);
  const challengeDocs = CHALLENGE_IDEAS.map((idea, index) => ({
    creatorId: posters[index % posters.length]._id,
    description: idea.description,
    startDate: addDays(today, idea.startOffset),
    endDate: addDays(today, idea.endOffset),
    targetDays: idea.targetDays,
    createdAt: dateAt(addDays(today, idea.startOffset)),
    studySeed: true,
  }));
  await db.collection("challenges").insertMany(challengeDocs);

  // report what was built, so the moderator can check it before a session
  console.log("\nStudy data ready.\n");
  console.log(`  Log in as:  ${USERNAME}  /  ${PASSWORD}\n`);
  console.log(`  ${sessions.length} workouts logged, ending this week`);
  console.log(
    `  Active pact with @${activePartner.username} (target ${WEEKLY_TARGET}/week)`,
  );
  console.log(`  Pact invite waiting from @${invitePartner.username}`);
  console.log(`  ${challengeDocs.length} challenges open today (${today})`);
  console.log("\nRun this again before the next participant.\n");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed:", err.message);
    process.exit(1);
  });
