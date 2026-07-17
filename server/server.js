import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./db/connection.js";
import passport from "./auth/passport.js";
import { ensureAuthenticated } from "./middleware/ensureAuthenticated.js";
import dotenv from "dotenv";
dotenv.config();

// __dirname isn't available in ES modules, so we rebuild it from the file's own URL
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import sessionsRouter from "./routes/sessions.js";
import challengesRouter from "./routes/challenges.js";
import pactsRouter from "./routes/pacts.js";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";

const app = express();

// lets secure cookies work when deployed behind a proxy (e.g. Render)
app.set("trust proxy", 1);

// Middleware
app.use(express.json()); // lets us read req.body as JSON

// -------- -------- -------- -------- -------- --------
// *Note This sets up login sessions. A "session" is how the server remembers
// you're logged in between requests — see the walkthrough in an earlier
// part of this project for the full explanation of how sessions/cookies work.
//
// This middleware MUST be registered before any router that needs
// req.session (that means before passport.session() below, and before
// any of our routers) or those requests won't have a session to read.
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    // *By default express-session keeps sessions in server memory, which
    // is fine for local dev but gets wiped every time the server
    // restarts — meaning everyone would get logged out on every deploy.
    // connect-mongo instead saves sessions in MongoDB, so logins survive
    // restarts. We reuse the same MONGO_URI we already connect with.
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      dbName: "spot", // MONGO_URI has no db name, so this must be explicit
      collectionName: "userSessions", // avoid colliding with the "sessions" collection
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in prod
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }),
);
// -------- -------- -------- -------- -------- --------

// passport reads/writes req.session, so it's set up after session()
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRouter);

// users routes need to know who's logged in (search excludes yourself,
// edit/delete are self-only), so they require login too
app.use("/api/users", ensureAuthenticated, usersRouter);

// a session belongs to one user, so every sessions route requires login
app.use("/api/sessions", ensureAuthenticated, sessionsRouter);

// challenges are shared between users, but only logged-in ones
app.use("/api/challenges", ensureAuthenticated, challengesRouter);

// pacts are personal, so every pacts route requires login
app.use("/api/pacts", ensureAuthenticated, pactsRouter);

// Test route — just to prove the server is alive
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// serve the built React app's static files (JS, CSS, images)
// calls next() if the file isn't found, so React Router can handle client-side routes
const frontendDist = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(frontendDist));

// any route that isn't an API route falls back to index.html, so React
// Router can handle client-side routes like /pacts/:id on a page refresh
app.get("*splat", (req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  await connectDB(); // wait for Mongo before accepting requests
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
