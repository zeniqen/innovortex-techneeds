# The mentorship platform

Three panels for the three roles on the TechNeeds mentorship platform, and
a profile page for everybody.

| Route | Who it is for | What it does |
|---|---|---|
| `/techboard` | everybody | The techboard. Signed out, it asks whether you are a mentee, a mentor or neither. Signed in, it is your dashboard. |
| `/login` | everybody | Sign in. A mentee uses their enrollment number, a mentor and an admin use their email. |
| `/profile/[id]` | anybody signed in | The generated profile: a crest, badges, a summary and what to work on next. `/profile/me` is your own. |

The three panels are not pages of their own. They are the techboard, which
shows you the panel that belongs to your role:

- a **mentee** gets their work, their scores and their rank
- a **mentor** gets their mentees, the resources they have published, and
  the work waiting to be marked
- an **admin** gets the programs, the mentors and the people on them

`/mentee`, `/mentor` and `/admin` still exist and redirect to the
techboard, so an old link lands somewhere sensible.

Every page on the platform keeps the site's own navigation: the floating
dock and the footer. The dock's profile link goes to `/profile/me`, which
resolves to whoever is signed in.

## Running it

The platform needs a database. In development that is a file in `.data/`,
which is created the first time the app runs:

```bash
npm run dev
```

Then open <http://localhost:3000/login>. The platform is empty, so the
sign-in page offers to set it up instead. That creates the first admin and
copies the live platform in: 17 programs, 26 mentors, 31 mentees and 31
resources. It takes about twenty seconds.

The setup screen tells you the credentials it made. The seeded accounts
all share one password, `techneeds-demo`, and the admin is `admin-demo`.

Setting the platform up again, from the same screen, is allowed and
throws the old data away first.

## Where the data comes from

The seed reads the live TechNeeds backend at
`https://tn-backend-1.onrender.com` and copies what it finds. That
backend is **read only from here**. It cannot be written to: both of its
login routes return a 500, and its write routes need a bearer token that
those routes would have issued, so there is no way to get one.

Three things are changed on the way in, and all three are deliberate:

- **Credentials.** The live backend stores password hashes and never
  shows the passwords, so there is nothing to copy. Every seeded account
  gets `techneeds-demo` instead.
- **Deadlines.** Almost every deadline on the live platform is in the
  past. The schedule is squeezed into the next three months, keeping its
  order, so there is work that is open and work that is due soon.
- **Scores.** The live platform records each mentee's total but not which
  pieces of work earned it. The seed spreads the score across the
  mentee's own work, smallest piece first, so the points, the badges and
  the level all agree with each other.

The enrollment numbers are the live ones, so the copy is recognisable.

## The database

SQLite, through `@libsql/client`. The same database is a file on disk in
development and a remote libSQL/Turso database in production, so the
deployment target decides one environment variable and nothing else.

| Variable | What it does |
|---|---|
| `DATABASE_URL` | `file:...` for a local file, `libsql://...` for a remote one. Without it the platform uses `.data/techneeds.db`. |

On a serverless platform there is no writable disk, so `DATABASE_URL` has
to point at a remote database. Nothing else in the codebase knows the
difference.

The tables are created on first use (`src/lib/platform/schema.ts`), so
there is no migration step to remember.

## Credentials and sessions

- Mentees sign in with an enrollment number: eight characters from a
  Crockford alphabet, so an enrollment number read off a printed sheet
  cannot be mistyped into another one.
- Mentors and admins sign in with an email address.
- Passwords are hashed with scrypt from the Node standard library, so
  there is no native module to compile and nothing to install.
- A session is a row in the database and an httpOnly cookie holding the
  token. Only the hash of the token is stored, so reading the sessions
  table does not hand over a usable credential.
- Credentials that are generated are shown **once** and never stored in
  the clear. The panel in front of you is the only copy.

## The profile page

The profile is worked out from what somebody has actually done: what they
have finished, what they scored, where they are on the leaderboard and
what they said they were interested in.

It is a set of rules rather than a language model
(`src/lib/platform/ai/profile.ts`). That means the same person always
gets the same profile, it costs nothing to serve, it needs no key, and
every claim on the page can be traced back to a number on the platform.
The shape of the output is the same as it would be with a model behind it,
so one can be put in front later.

The crest (`src/lib/platform/ai/avatar.ts`) is drawn from a hash of the
person's id and name. Nothing is stored, and it is the same on every
device and every visit.

## The code

```
src/lib/platform/
  types.ts        the domain model
  schema.ts       the tables
  db.ts           the connection and the migration
  credentials.ts  enrollment numbers, passwords, hashing
  session.ts      sessions
  auth.ts         signing in
  store.ts        every read and write
  seed.ts         copying the live platform in
  guards.ts       who is allowed on which page
  dates.ts        dates, formatted the same way everywhere
  clock.ts        reading the clock in one place
  ai/
    avatar.ts     the generative crest
    profile.ts    the profile engine

src/app/api/platform/   the API
src/app/{techboard,login,profile}   the pages
src/components/platform/   the panel components
  mentee-panel.tsx, mentor-panel.tsx, admin-panel.tsx
```

## Two things worth knowing about Next 16

The panels read the session cookie, so they cannot be prerendered into the
static shell. Each one sits behind a `<Suspense>` boundary and is marked
`export const instant = false`, and `currentUser()` calls
`await connection()` so the render happens at request time. Without that
call Next refuses to prerender the page, because checking whether a
session has expired reads the clock.

Dates are formatted by hand in `src/lib/platform/dates.ts` rather than
with `toLocaleDateString()`. The server and the browser do not always
agree on a locale, and when they do not, React throws a hydration error.
