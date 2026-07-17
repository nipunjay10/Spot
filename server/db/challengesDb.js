import { connectDB } from "./connection.js";
import { ObjectId } from "mongodb";

// This file is the only place that talks to the "challenges" collection.
// A challenge is a public template: it has a creator and a date window, but no
// per-user state. Each person who takes it on gets their own row in the
// "acceptances" collection (see acceptancesDb.js), so a challenge stays open
// even after other people accept it.

// CREATE a new challenge template
async function create(challengeData) {
  const db = await connectDB();
  const result = await db.collection("challenges").insertOne(challengeData);
  return { _id: result.insertedId, ...challengeData };
}

// READ a challenge by its _id
async function findById(id) {
  const db = await connectDB();
  return db.collection("challenges").findOne({ _id: new ObjectId(id) });
}

// READ every challenge, newest first (the caller splits these into sections)
async function findAll() {
  const db = await connectDB();
  return db.collection("challenges").find({}).sort({ createdAt: -1 }).toArray();
}

// DELETE a challenge
async function remove(id) {
  const db = await connectDB();
  const result = await db
    .collection("challenges")
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

export const challengesDb = {
  create,
  findById,
  findAll,
  remove,
};
