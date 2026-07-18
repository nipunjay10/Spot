# Database backup

A full snapshot of the Spot database (`spot`), in two forms:

- **`dump/`** — a binary `mongodump` snapshot (BSON + metadata). Restore this to
  recreate the database exactly, indexes and all.
- **`json/`** — one human-readable JSON array per collection. Handy for reading the
  data or importing a single collection.

Collections (document counts): `users` (24), `sessions` (1167), `challenges` (150),
`pacts` (15), `acceptances` (103), `userSessions` (58 — the login-session store,
managed by connect-mongo; it rebuilds itself and does not need restoring).

## Restore the whole database

From binary dump (recommended — exact copy):

```bash
mongorestore --uri "<your-mongodb-connection-string>" \
  --nsInclude "spot.*" --drop dump
```

## Import a single collection from JSON

```bash
mongoimport --uri "<your-mongodb-connection-string>/spot" \
  --collection users --jsonArray --file json/users.json
```
