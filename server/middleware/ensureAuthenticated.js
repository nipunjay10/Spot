// Blocks a request unless the user is logged in (req.isAuthenticated()
// comes from passport.session(), set up in server.js).
export function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Not logged in" });
}
