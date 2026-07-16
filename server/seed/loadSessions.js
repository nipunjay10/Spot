import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function loadSessions() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db('spot');

  const rawData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'data', 'sessions_raw.json'), 'utf-8')
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

  await db.collection('sessions').deleteMany({});
  const result = await db.collection('sessions').insertMany(sessions);
  console.log(`Inserted ${result.insertedCount} sessions`);

  await client.close();
}

loadSessions().catch(console.error);