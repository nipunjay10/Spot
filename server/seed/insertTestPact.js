// TEST PACT - KHUSH WILL DELETE AND ADD HIS OWN AFTER TESTING

import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

async function insertTestPact() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db("spot");

  const pact = {
    partnerA: new ObjectId("6a54285f252469942edfcb56"),
    partnerB: new ObjectId("6a54285f252469942edfcb57"),
    weeklyTarget: 3,
    currentStreak: 0,
    createdAt: new Date(),
  };

  const result = await db.collection("pacts").insertOne(pact);
  console.log("Inserted test pact with id:", result.insertedId.toString());

  await client.close();
}

insertTestPact().catch(console.error);
