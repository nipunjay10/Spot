import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import { connectDB } from "./db/connection.js";
import passport from "./auth/passport.js";
import dotenv from "dotenv";
dotenv.config();

import sessionsRouter from "./routes/sessions.js";
import challengesRouter from "./routes/challenges.js";
import pactsRouter from "./routes/pacts.js";
import authRouter from "./routes/auth.js";

const app = express();

// Render (and most hosts) put our server behind a reverse proxy that
// terminates HTTPS for us — the browser talks HTTPS to the proxy, but the
// proxy talks plain HTTP to our app. Without this line, Express thinks
// every request is insecure HTTP and would refuse to send secure cookies
// (see the cookie.secure option below). "trust proxy" tells Express to
// trust the proxy's header that says "this was really HTTPS."
app.set("trust proxy", 1);

// Middleware
app.use(express.json()); // lets us read req.body as JSON

// This sets up login sessions. A "session" is how the server remembers
// you're logged in between requests — see the walkthrough in an earlier
// part of this project for the full explanation of how sessions/cookies work.
//
// This middleware MUST be registered before any router that needs
// req.session (that means before passport.session() below, and before
// any of our routers) or those requests won't have a session to read.
app.use(
  session({
    // Used to cryptographically sign the session-id cookie so a client
    // can't tamper with it or forge someone else's session id.
    secret: process.env.SESSION_SECRET,

    // Don't re-save a session to the store if nothing in it changed on
    // this request — avoids pointless extra writes to MongoDB.
    resave: false,

    // Don't create/store a session until something is actually put into
    // it (like logging in). Stops us from creating empty session junk
    // in the database for every random visitor who never logs in.
    saveUninitialized: false,

    // By default express-session keeps sessions in server memory, which
    // is fine for local dev but gets wiped every time the server
    // restarts — meaning everyone would get logged out on every deploy.
    // connect-mongo instead saves sessions in MongoDB, so logins survive
    // restarts. We reuse the same MONGO_URI we already connect with.
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      // MONGO_URI doesn't include a database name, so without this,
      // connect-mongo would silently default to a database called
      // "test" instead of our real "spot" database. Found this while
      // testing — always double check where data actually lands!
      dbName: "spot",
      // connect-mongo's default collection name is "sessions", which
      // would collide with our own separate workout-sessions collection
      // (also called "sessions"). Naming it differently keeps login
      // sessions and workout sessions from ever mixing together.
      collectionName: "userSessions",
    }),

    cookie: {
      // Only send this cookie over HTTPS once we're deployed in
      // production. Locally we're on plain http://localhost, so this
      // must be false there or the browser will refuse to store the
      // cookie and login would silently break.
      secure: process.env.NODE_ENV === "production",

      // How long the login cookie lasts before the browser deletes it
      // and you'd need to log in again. Without this, it's a "session
      // cookie" that disappears the moment the browser tab/window is
      // closed, which would be annoying while demoing/grading the app.
      // 7 days, written out in milliseconds: 7 days * 24 hours * 60
      // minutes * 60 seconds * 1000 ms.
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

// Passport must be set up after the session middleware, since it reads
// and writes to req.session to keep track of who is logged in.
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRouter);

// wired in session routes
app.use("/api/sessions", sessionsRouter);

// wired in challenge routes
app.use("/api/challenges", challengesRouter);

app.use("/api/pacts", pactsRouter);

// Test route — just to prove the server is alive
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  await connectDB(); // wait for Mongo before accepting requests
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
