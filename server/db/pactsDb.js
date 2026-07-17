import { connectDB } from "./connection.js";
import { ObjectId } from "mongodb";

// This file is the only place that talks to the "pacts" collection.
// Routes call these functions instead of touching the database directly.

// CREATE a new pact
async function create(pactData) {
  const db = await connectDB();
  const result = await db.collection("pacts").insertOne(pactData);
  return { _id: result.insertedId, ...pactData };
}

// READ a pact by its _id
async function findById(id) {
  const db = await connectDB();
  return db.collection("pacts").findOne({ _id: new ObjectId(id) });
}

// READ all pacts where this user is either partner
async function findByUser(userId) {
  const db = await connectDB();
  const id = new ObjectId(userId);
  return db
    .collection("pacts")
    .find({ $or: [{ partnerA: id }, { partnerB: id }] })
    .toArray();
}

// READ a pact between two specific users — used to stop the same two
// people from creating a duplicate pact with each other. Declining or
// deleting a pact removes its row, so any pact this finds is still
// pending or active and should block a fresh proposal.
async function findBetween(userIdA, userIdB) {
  const db = await connectDB();
  const idA = new ObjectId(userIdA);
  const idB = new ObjectId(userIdB);
  // a pact could have been created with either user as partnerA, so we
  // have to check both orderings, not just (idA, idB)
  return db.collection("pacts").findOne({
    $or: [
      { partnerA: idA, partnerB: idB },
      { partnerA: idB, partnerB: idA },
    ],
  });
}

// UPDATE only the weeklyTarget field (the only field a pact allows editing)
async function updateTarget(id, weeklyTarget) {
  const db = await connectDB();
  const result = await db
    .collection("pacts")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { weeklyTarget } },
      { returnDocument: "after" },
    );
  return result;
}

// UPDATE any set of fields on a pact — used to flip a pending pact to
// active (setting status and activatedAt) when the invited partner accepts
async function updateStatus(id, fields) {
  const db = await connectDB();
  const result = await db
    .collection("pacts")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: fields },
      { returnDocument: "after" },
    );
  return result;
}

// DELETE a pact (dissolving it)
async function remove(id) {
  const db = await connectDB();
  const result = await db
    .collection("pacts")
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

export const pactsDb = {
  create,
  findById,
  findByUser,
  findBetween,
  updateTarget,
  updateStatus,
  remove,
};
