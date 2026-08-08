# Usability study data

Everything here exists to support the usability study. It builds one demo
account with a couple of months of history so participants can try the app on
a filled-in account instead of an empty one.

This runs against a **local** MongoDB. The Atlas cluster is never touched.

## Why this is needed

The original seed data has gone stale:

- every challenge in it has already ended, so the Challenges page shows nothing
  to accept
- almost no sessions fall in the current week, so every pact shows a streak of
  0 and "0 / 3" for this week

Both of those make the pact and challenge features look broken. This script
adds fresh data on top of the original so they work during a session.

## One-time setup

**1. Start the local MongoDB.** There is already a Docker container named
`mongodb` on this machine with the Spot data loaded. Open Docker Desktop, then:

```bash
docker start mongodb
```

Check it is up and has the data:

```bash
mongosh --quiet mongodb://localhost:27017/spot --eval "db.users.countDocuments()"
```

That should print 24 or more. If the container is missing, or the count is 0,
create a fresh one and load the data — see "Starting from nothing" at the end.

**2. Point the app at it.** Save your Atlas connection string somewhere safe
first:

```bash
cp server/.env server/.env.atlas.bak
```

Then edit `server/.env` so the URI is the local one:

```
MONGO_URI=mongodb://localhost:27017
```

Leave `SESSION_SECRET` and `PORT` alone. Do not put a database name on the end
of the URI — the app adds `spot` itself.

## Before every participant

From the `server/` folder:

```bash
npm run study:seed
```

Run this before **each** session, not just the first one. During a session the
participant accepts the pact invite, starts a new pact, logs a workout and posts
a challenge — this puts all of that back so the next participant starts from the
same place.

Then start the app as usual — `npm run dev` in `server/`, `npm run dev` in
`frontend/`.

## What you get

One account — username `spotdemo`, password `demospot123`, shown in the app as
"Test Account". Every participant uses it. It has:

- about eight weeks of workout history, ending in the current week
- a bench press that climbs from 135 up to 205 lbs, so there is a clear answer
  to "what is the heaviest bench press you have ever done"
- personal records marked on the lifts that beat everything before them
- an active pact with a partner, with a streak of several weeks and this week
  still in progress (you ahead of your partner, so there is something to say
  about who is falling behind)
- a pact invite from someone else, waiting to be accepted
- no other pacts, so any other user is a valid partner to start a new pact with

Plus seven challenges that are open today for anyone to accept.

The script prints all of this when it finishes, including which partners are in
the two pacts.

## Notes

Every record the script creates is marked with `studySeed: true`. Each run
deletes the previous ones before building new records, so running it twice does
not create duplicates.

Dates are worked out from the day you run it, never written into the code. That
matters because a week runs Monday to Sunday — if the dates were fixed, a pact
showing "2 / 3 this week" one day would show "0 / 3" after the next Monday.

To remove the study data and add nothing back:

```bash
npm run study:clean
```

## Switching back to Atlas

Restore the connection string you saved:

```bash
cp server/.env.atlas.bak server/.env
```

The local database can be left alone, or stopped with `docker stop mongodb`.

## Starting from nothing

Only needed if the local database is gone or empty. Create a container and load
the data into it, from the project root:

```bash
docker run -d -p 27017:27017 --name spot-mongo mongo:7
mongorestore --uri "mongodb://localhost:27017" --nsInclude "spot.*" server/data/dump
```

This only reads `server/data/dump/`, it never changes it. The original users
have to be there, because the demo account forms pacts with them and the partner
search in task T5 needs people to find.
