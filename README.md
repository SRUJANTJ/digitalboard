# Digital Notice Board — Phase 1 Foundation

Next.js (Pages Router) + Prisma + JWT auth in httpOnly cookies.

Right now the database is a **local SQLite file** (`db.sqlite`) — a real
`.env` file is already included with `DATABASE_URL="file:./db.sqlite"`, so
there's nothing to configure to start building. When you're ready for a real
server (Neon, etc.), it's a two-line schema change plus editing that same
`.env` file — every query in the app goes through Prisma's client, so
`pages/api/**` never touches connection details directly.

## Setup

```bash
npm install                  # also runs `prisma generate` automatically
npm run db:push              # creates db.sqlite with the users/notices tables
npm run seed                 # creates test users + sample notices
npm run dev
```

That's it — `.env` already ships with a working `DATABASE_URL` for local
SQLite and a `JWT_SECRET` placeholder. App runs at http://localhost:3000.
`db.sqlite` appears in the project root after `db:push`.

**Already have a `db.sqlite` from before the `category` field was added?**
Run `npx prisma db push` again (Prisma will add the new column to the
existing `notices` table — no data is lost) then `npm run dev` as normal.

## Moving to Postgres later (e.g. Neon)

1. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`
   in the `datasource db` block (the `url` line already reads from `.env`,
   no change needed there).
2. In `.env`, replace `DATABASE_URL` with your Postgres connection string
   (Neon dashboard → your project → **Connection string** → copy the pooled
   string, it already includes `?sslmode=require`). Set `JWT_SECRET` to
   something random too, for anything beyond local dev.
3. Run:
   ```bash
   npx prisma generate
   npm run db:push
   npm run seed   # optional, re-seeds the new database
   ```

From then on, switching between different Postgres hosts (Neon → Supabase →
RDS → Railway) really is a `DATABASE_URL`-only change — no code or schema
edits, since `provider` stays `"postgresql"` throughout.

A plain reference `prisma/schema.sql` is included too, showing the same
tables as raw SQL, in case anyone ever needs to set up a server by hand
instead of via `db:push`.

## Test accounts (created by `npm run seed`)

| Username  | Password    | Role    | Dept | Sem |
|-----------|-------------|---------|------|-----|
| admin     | admin123    | admin   | —    | —   |
| student1  | student123  | student | CSE  | 5   |
| student2  | student123  | student | ECE  | 3   |

Admin can add more students (with department + semester) from the **Students**
tab of `/admin` — there's no self-signup, accounts are admin-created only.

## What's included

- **Schema**: `prisma/schema.prisma` — `User` (role: admin/student,
  department, semester) and `Notice` (department, semester, urgency:
  low/medium/high, category: general/academic/festive/event/exam/holiday),
  plus `lib/prisma.js` client singleton.
- **Auth**: `lib/auth.js` — bcrypt password hashing, JWT sign/verify, httpOnly
  cookie helpers, `requireAuth()` wrapper for API routes.
- **Constants**: `lib/constants.js` — the shared department/semester option
  lists used by both the "add student" and "post notice" forms, plus the
  notice category list and its display styling (badge colors, emoji).
- **API routes**:
  - `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
  - `GET/POST /api/notices` — GET auto-filters to the student's own dept/semester
    (or department `ALL`); admin sees everything and can filter via query params
    (`department`, `semester`, `urgency`, `category`, `search`). Results are
    always sorted high-urgency-first, so the most important notices land at
    the top of the board regardless of when they were posted. POST/PUT/DELETE
    are admin-only, and every notice can target a specific department, a
    specific semester, or both (leave semester blank for "everyone in that
    department", or department `ALL` + a semester for "everyone in that
    semester").
  - `GET/PUT/DELETE /api/notices/[id]`
  - `GET/POST /api/users` — admin-only: list students, or create a new student
    account with username/password/name/department/semester.
  - `DELETE /api/users/[id]` — admin-only: remove a student account.
- **Pages**:
  - `/login` — sign in
  - `/dashboard` — student view: search + urgency filter + category filter,
    sorted high-priority-first. Each notice is color-coded and emoji-tagged
    by category (📚 academic, 🎉 festive, 📅 event, 📝 exam, 🏖️ holiday,
    📌 general), and the first high-urgency notice is flagged "Top priority".
  - `/admin` — admin view, two tabs:
    - **Notices** — create/edit/delete notices, targeted by department +
      semester, tagged with an urgency and a category (same color-coding as
      the student view)
    - **Students** — add a new student (with department + semester) or remove one
  - `/` — redirects based on role

## Team split (suggested)

1. **Auth & Roles** — extend `lib/auth.js` / `pages/api/auth/*`: password reset,
   bulk student import, signup flow if needed.
2. **Notice CRUD** — extend `pages/api/notices/*` and `pages/admin`: attachments,
   notice categories beyond dept/semester, scheduled/expiring notices.
3. **Student Dashboard** — extend `pages/dashboard.js`: pagination, read/unread
   state, notification badges, saved filters.
4. **Database & Deployment** — Prisma migrations (`prisma migrate dev` once
   there's a shared team DB), seeding beyond the demo data, hosting on Vercel
   with Neon, integration tests.

## Notes

- Passwords are hashed with bcrypt; never stored in plain text.
- JWT is stored in an httpOnly, sameSite=lax cookie — not accessible from client JS.
- `.env` is gitignored; each environment/deploy sets its own `DATABASE_URL`.
- Search (`contains`) behaves slightly differently by provider — Postgres's
  default collation is case-sensitive, MySQL/SQLite are usually not. If you
  need guaranteed case-insensitive search on Postgres, that's a one-line
  addition (`mode: "insensitive"` in the `contains` filters in
  `pages/api/notices/index.js`) — left out here so the same code runs
  unmodified against MySQL/SQLite too.
- Fonts (Fraunces / Inter / IBM Plex Mono) load from Google Fonts via
  `styles/globals.css` — needs internet on first load, same as any web font.
- This was written directly (no live `npm install` in the build sandbox), so do
  a first `npm install && npm run db:push && npm run seed && npm run dev`
  locally to confirm everything compiles cleanly before building on top of it.
