import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function loadPacts() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db("spot");

  // pull the raw session/challenge data so we can reuse their exact ids
  const sessionsRaw = JSON.parse(
    fs.readFileSync(path.join(__dirname, "data", "sessions_raw.json"), "utf-8"),
  );
  const challengesRaw = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "data", "challenges_raw.json"),
      "utf-8",
    ),
  );

  // same id derivation as loadUsers.js, so every pact partner has a real user doc
  const idSet = new Set();
  for (const row of sessionsRaw) idSet.add(row.userId);
  for (const row of challengesRaw) {
    idSet.add(row.creatorId);
    if (row.accepterId) idSet.add(row.accepterId);
  }
  const sortedIds = [...idSet].sort();

  // pair up consecutive ids (0&1, 2&3, ...) so each user appears in at most one pact
  const pacts = [];
  for (let i = 0; i + 1 < sortedIds.length; i += 2) {
    pacts.push({
      partnerA: new ObjectId(sortedIds[i]),
      partnerB: new ObjectId(sortedIds[i + 1]),
      weeklyTarget: 2 + (pacts.length % 3), // cycles through 2, 3, 4
      currentStreak: pacts.length % 6, // cycles through 0-5
      createdAt: new Date(),
    });
  }

  // wipe any previous seed run before inserting fresh data
  await db.collection("pacts").deleteMany({});
  const result = await db.collection("pacts").insertMany(pacts);
  console.log(`Inserted ${result.insertedCount} pacts`);

  await client.close();
}

loadPacts().catch(console.error);
