import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Gym-themed usernames, zipped by index onto the sorted ids below.
// There must be at least as many names as ids pulled from the raw JSONs.
const usernames = [
  "liftlarry",
  "squatqueen",
  "benchbeth",
  "deadliftdan",
  "cardiocarl",
  "yogayara",
  "sprintsam",
  "plankpat",
  "burpeebill",
  "rowrachel",
  "kettlekim",
  "pushuppete",
  "gripgina",
  "hiitheidi",
  "corecody",
  "stretchsteph",
  "boxingbo",
  "climbclara",
  "swolesid",
  "flexfiona",
];

// Extra users with no session/challenge history, so partner search has
// "new member" results that aren't already locked into a pact or streak.
const extraUsernames = [
  "newbienate",
  "freshfaye",
  "rookierob",
  "startingstacy",
];

async function loadUsers() {
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

  // collect every distinct id referenced across both files into one set,
  // so a user document exists for anyone who shows up as userId/creatorId/accepterId
  const idSet = new Set();
  for (const row of sessionsRaw) idSet.add(row.userId);
  for (const row of challengesRaw) {
    idSet.add(row.creatorId);
    if (row.accepterId) idSet.add(row.accepterId);
  }
  const sortedIds = [...idSet].sort();

  if (sortedIds.length > usernames.length) {
    throw new Error(
      `Found ${sortedIds.length} distinct ids but only ${usernames.length} usernames — add more names`,
    );
  }

  // one shared demo password hash reused for every seeded user
  const passwordHash = await bcrypt.hash("spot123", 10);

  const seededUsers = sortedIds.map((idString, index) => ({
    _id: new ObjectId(idString),
    username: usernames[index],
    email: `${usernames[index]}@example.com`,
    passwordHash,
    displayName: usernames[index],
    bio: "",
    favoriteGym: "",
    createdAt: new Date(),
  }));

  // extra users get fresh, randomly generated ObjectIds — they aren't
  // referenced by any session or challenge
  const extraUsers = extraUsernames.map((username) => ({
    _id: new ObjectId(),
    username,
    email: `${username}@example.com`,
    passwordHash,
    displayName: username,
    bio: "",
    favoriteGym: "",
    createdAt: new Date(),
  }));

  const users = [...seededUsers, ...extraUsers];

  // wipe any previous seed run before inserting fresh data
  await db.collection("users").deleteMany({});
  // unique indexes stop two users from ever sharing a username or email
  await db.collection("users").createIndex({ username: 1 }, { unique: true });
  await db.collection("users").createIndex({ email: 1 }, { unique: true });

  const result = await db.collection("users").insertMany(users);
  console.log(`Inserted ${result.insertedCount} users`);

  await client.close();
}

loadUsers().catch(console.error);
