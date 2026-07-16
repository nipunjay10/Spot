import { ObjectId } from "mongodb";

// Checks that req.params.id is a valid MongoDB ObjectId before a route
// handler tries to use it. If it's valid, we convert it once here and
// attach it to req.objectId so every route doesn't have to repeat that.
export function requireValidId(req, res, next) {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  req.objectId = new ObjectId(req.params.id);
  next();
}
