-- Reference only — this is what prisma/schema.prisma maps to.
-- You never need to run this by hand: `npm run db:push` creates/updates the
-- real tables for whichever database DATABASE_URL points at (SQLite today,
-- Postgres later). Kept here so the shape of the data is easy to see, and as
-- a starting point if anyone ever needs to inspect/migrate a server by hand.

CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT, -- SERIAL / IDENTITY on Postgres
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL,                     -- 'admin' | 'student'
  department    TEXT,
  semester      INTEGER,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE notices (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  department  TEXT NOT NULL DEFAULT 'ALL',
  semester    INTEGER,
  urgency     TEXT NOT NULL DEFAULT 'medium',       -- 'low' | 'medium' | 'high'
  category    TEXT NOT NULL DEFAULT 'general',      -- 'general' | 'academic' | 'festive' | 'event' | 'exam' | 'holiday'
  created_by  INTEGER NOT NULL REFERENCES users(id),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
