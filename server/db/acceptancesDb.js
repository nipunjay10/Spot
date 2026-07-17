import { connectDB } from "./connection.js";
import { ObjectId } from "mongodb";

// This file is the only place that talks to the "acceptances" collection.
// One acceptance = one person taking on one challenge. It holds that person's
// own progress (which days they marked done) and their own status, so many
// people can accept the same challenge without affecting each other.

// CREATE a new acceptance
async function create(acceptanceData) {
  const db = await connectDB();
  const result = await db.collection("acceptances").insertOne(acceptanceData);
  return { _id: result.insertedId, ...acceptanceData };
}

// READ the acceptance a given user has on a given challenge, if any
async function findForUserAndChallenge(userId, challengeId) {
  const db = await connectDB();
  return db.collection("acceptances").findOne({
    userId: new ObjectId(userId),
    challengeId: new ObjectId(challengeId),
  });
}

// READ every acceptance belonging to one user (their accepted/done challenges)
async function findByUser(userId) {
  const db = await connectDB();
  return db
    .collection("acceptances")
    .find({ userId: new ObjectId(userId) })
    .toArray();
}

// READ how many people have accepted a challenge — used to block deleting a
// challenge once anyone has taken it on
async function countForChallenge(challengeId) {
  const db = await connectDB();
  return db
    .collection("acceptances")
    .countDocuments({ challengeId: new ObjectId(challengeId) });
}

// UPDATE any set of fields on an acceptance (mark a day done, resolve status)
async function update(id, fields) {
  const db = await connectDB();
  const result = await db
    .collection("acceptances")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: fields },
      { returnDocument: "after" },
    );
  return result;
}

export const acceptancesDb = {
  create,
  findForUserAndChallenge,
  findByUser,
  countForChallenge,
  update,
};
