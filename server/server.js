import express from 'express';
import session from 'express-session';
import { connectDB } from './db/connection.js';
import dotenv from 'dotenv';
dotenv.config();

import sessionsRouter from './routes/sessions.js';
import challengesRouter from './routes/challenges.js';
import pactsRouter from './routes/pacts.js';

const app = express();

// Middleware
app.use(express.json()); // lets us read req.body as JSON

// session middleware must come before any router that needs req.session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

// wired in session routes
app.use('/api/sessions', sessionsRouter);

// wired in challenge routes
app.use('/api/challenges', challengesRouter);

app.use('/api/pacts', pactsRouter);

// Test route — just to prove the server is alive
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  await connectDB(); // wait for Mongo before accepting requests
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();