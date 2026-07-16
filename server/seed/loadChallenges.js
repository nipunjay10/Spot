import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

  const challenges = rawData.map((row) => ({
    creatorId: new ObjectId(row.creatorId),
    accepterId: row.accepterId ? new ObjectId(row.accepterId) : null,
    description: row.description,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status,
    proofEntries: [],
    createdAt: new Date(),
  }));

  await db.collection("challenges").deleteMany({});
  const result = await db.collection("challenges").insertMany(challenges);
  console.log(`Inserted ${result.insertedCount} challenges`);

  await client.close();
}

loadChallenges().catch(console.error);
