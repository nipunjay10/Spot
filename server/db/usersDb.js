import { connectDB } from "./connection.js";
import { ObjectId } from "mongodb";

// This file is the only place that talks to the "users" collection.
// Routes call these functions instead of touching the database directly.
// These functions return the RAW user document, passwordHash included —
// it is the route's job to call sanitize() before sending a user to the client.

// Removes the passwordHash before a user is ever sent back in a response.
// We NEVER want a password hash leaking out over the API.
function sanitize(user) {
  if (!user) return user;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

// CREATE a new user
async function create(userData) {
  const db = await connectDB();
  const result = await db.collection("users").insertOne(userData);
  return { _id: result.insertedId, ...userData };
}

// READ a user by their _id
async function findById(id) {
  const db = await connectDB();
  return db.collection("users").findOne({ _id: new ObjectId(id) });
}

// READ many users by their _ids in one query (avoids a lookup per id)
async function findByIds(ids) {
  const db = await connectDB();
  const objectIds = ids.map((id) => new ObjectId(id));
  return db
    .collection("users")
    .find({ _id: { $in: objectIds } })
    .toArray();
}

// READ a user by username (used for login)
async function findByUsername(username) {
  const db = await connectDB();
  return db.collection("users").findOne({ username });
}

// READ a user by email (used to check for duplicates on register)
async function findByEmail(email) {
  const db = await connectDB();
  return db.collection("users").findOne({ email });
}

// SEARCH users by username or displayName, excluding one user
// (the person doing the searching, so you never find yourself as a "partner")
// $regex with $options: "i" means "contains this text, ignoring case" —
// e.g. searching "sam" will match a username like "Samantha_Lifts"
async function search(term, excludeUserId) {
  const db = await connectDB();
  return (
    db
      .collection("users")
      .find({
        _id: { $ne: new ObjectId(excludeUserId) },
        $or: [
          { username: { $regex: term, $options: "i" } },
          { displayName: { $regex: term, $options: "i" } },
        ],
      })
      // anyone can search anyone, so list only the fields a stranger may see —
      // email stays out of search results and is shown on a pact instead
      .project({
        username: 1,
        displayName: 1,
        bio: 1,
        favoriteGym: 1,
        createdAt: 1,
      })
      .limit(20)
      .toArray()
  );
}

// UPDATE a user's profile fields
async function update(id, updates) {
  const db = await connectDB();
  const result = await db
    .collection("users")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: "after" },
    );
  return result;
}

// DELETE a user
async function remove(id) {
  const db = await connectDB();
  const result = await db
    .collection("users")
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

export const usersDb = {
  create,
  findById,
  findByIds,
  findByUsername,
  findByEmail,
  search,
  update,
  remove,
  sanitize,
};
