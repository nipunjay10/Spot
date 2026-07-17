import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// how many days a "YYYY-MM-DD" window covers, counting both ends
function daysInRange(startDate, endDate) {
  const start = new Date(startDate + "T12:00:00Z");
  const end = new Date(endDate + "T12:00:00Z");
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

// the target for a challenge: a "7-day" challenge asks for 7 days, everything
// else asks for a modest 3 days (never more than the window can hold)
function targetFor(description, startDate, endDate) {
  const window = daysInRange(startDate, endDate);
  const wants = /7-day/i.test(description) ? 7 : 3;
  return Math.min(wants, window);
}

// the first n dates of the window, as "YYYY-MM-DD" strings — used to seed how
// many days an accepter marked done
function firstDays(startDate, n) {
  const days = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(startDate + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

async function loadChallenges() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db("spot");

  const rawData = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "data", "challenges_raw.json"),
      "utf-8",
    ),
  );

  // every raw row becomes a challenge template — an open goal with no per-user
  // state. We give each one its own _id so the acceptances can point back to it.
  const challenges = rawData.map((row) => ({
    _id: new ObjectId(),
    creatorId: new ObjectId(row.creatorId),
    description: row.description,
    startDate: row.startDate,
    endDate: row.endDate,
    targetDays: targetFor(row.description, row.startDate, row.endDate),
    createdAt: new Date(),
  }));

  // build an acceptance for every row that had a real accepter who wasn't the
  // creator. Rows with no accepter (or a self-accept) just stay open.
  const acceptances = [];
  rawData.forEach((row, i) => {
    const challenge = challenges[i];
    const validAccepter =
      row.accepterId && row.accepterId !== row.creatorId;
    if (!validAccepter || row.status === "open") return;

    // seed enough completed days to justify the row's status: a completed
    // challenge met its target, a failed one fell short
    const target = challenge.targetDays;
    const doneCount =
      row.status === "completed" ? target : Math.max(0, target - 1);

    acceptances.push({
      challengeId: challenge._id,
      userId: new ObjectId(row.accepterId),
      status: row.status,
      completedDays: firstDays(row.startDate, doneCount),
      acceptedAt: new Date(),
    });
  });

  await db.collection("challenges").deleteMany({});
  const challengeResult = await db
    .collection("challenges")
    .insertMany(challenges);
  console.log(`Inserted ${challengeResult.insertedCount} challenges`);

  await db.collection("acceptances").deleteMany({});
  const acceptanceResult = await db
    .collection("acceptances")
    .insertMany(acceptances);
  console.log(`Inserted ${acceptanceResult.insertedCount} acceptances`);

  await client.close();
}

loadChallenges().catch(console.error);
