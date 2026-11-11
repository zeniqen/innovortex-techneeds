# The mentorship platform

Three panels and a profile page, over a choice of two backends.

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

## Two backends

The panels ask one set of questions. Where the answers come from is an
environment variable.

| | `PLATFORM_BACKEND=sqlite` (the default) | `PLATFORM_BACKEND=tn` |
|---|---|---|
| Where the data lives | a SQLite file in `.data/` | the Express and MongoDB backend in `backend/` |
| Needs setting up | nothing | MongoDB, and `cd backend && npm install` |
| Works on a serverless host | no, unless `DATABASE_URL` points at Turso | yes, if the MongoDB is reachable |

The SQLite one is the default because it works with one command and
nothing installed. The tn one is there so the panels can run against the
backend that came with the platform.

```
PLATFORM_BACKEND=tn
TN_BACKEND_URL=http://localhost:8000
TN_ADMIN_KEY=the same key as the backend's ADMIN_KEY
```

`DATABASE_URL` overrides where the SQLite file lives, and is what a
serverless host needs:

```
DATABASE_URL=libsql://your-database.turso.io
DATABASE_AUTH_TOKEN=...
```

## Running it

```bash
npm install
npm run dev
```

Open <http://localhost:3000/login>. The platform is empty, so the
sign-in page offers to set it up instead. That creates the first admin and
copies the live platform in: 17 programs, 26 mentors, 31 mentees and 31
resources. It takes about twenty seconds.

The setup screen tells you the credentials it made. The seeded accounts
all share one password, `techneeds-demo`, and the admin is `admin-demo`.

Setting the platform up again, from the same screen, is allowed and
throws the old data away first.

## Running against the tn backend

In one terminal:

```bash
cd backend
npm install
cp .env.example .env      # fill in MONGO_URI, JWT_SECRET and ADMIN_KEY
npm run seed              # one program, a mentor and a mentee to sign in with
npm start
```

In another:

```bash
PLATFORM_BACKEND=tn \
TN_BACKEND_URL=http://localhost:8000 \
TN_ADMIN_KEY=the ADMIN_KEY from backend/.env \
npm run dev
```

The seed prints the demo accounts:

```
  mentor   smith@example.com / techneeds-demo
  mentee   DEMO0001 / techneeds-demo
```

The admin is still `admin@techneeds.test` / `admin-demo`, because the tn
backend has no admin role: an admin is the person who runs the platform
rather than a person in it, so they stay in this project's own database.

See `backend/README.md` for what was changed in the backend.

## What an admin can do

On the techboard, signed in as an admin:

- **Create a program**, and give it a subject area so it can be matched
  against what a mentee has done.
- **Onboard a mentor.** The password is generated and shown once.
- **Put a mentor on a program.** Open the program and put them on it, or
  open the mentor and assign them a program. Both are the same thing, and
  both are there because an admin thinks about it both ways: "this mentor
  should run this program" and "this program needs a mentor". A mentor can
  run more than one.
- **Take a mentor off a program.** The mentor stays on the platform.
- **Delete a mentor.** Their mentees do not go with them: a mentee belongs
  to a program, not to the person who happened to be looking after it, so
  they stay on theirs and carry on. The resources they published stay too.
- **Delete a program.** Everything on it goes with it: the resources, the
  progress the mentees had on them, the submissions, and the links
  between the program and the people on it.
- **Add another admin.**

Deleting asks first: the button arms, and a second press does it.

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

Behind the profile there is a particle field
(`src/components/ui/particles.tsx`). It is the height of the viewport
rather than the height of the page: the canvas is cleared and redrawn
every frame, and a canvas the height of a long page is four times the
work for a background nobody can tell apart. It costs about 4% of the
main thread and drops no frames.

## The code

```
src/lib/platform/
  types.ts        the domain model
  schema.ts       the tables, for the SQLite backend
  db.ts           the connection and the migration
  clock.ts        reading the clock in one place
  dates.ts        dates, formatted the same way everywhere
  credentials.ts  enrollment numbers, passwords, hashing
  session.ts      sessions
  session-cookie.ts  the name of the session cookie
  auth.ts         signing in, against either backend
  guards.ts       who is allowed on which page
  store.ts        chooses the backend and re-exports it
  store-types.ts  the interface both backends implement
  admin-store.ts  the admins and the audit log, always local
  seed.ts         copying the live platform in
  backends/
    sqlite.ts     the default: this project's own database
    tn.ts         the Express and MongoDB backend
  ai/
    avatar.ts     the generative crest
    profile.ts    the profile engine

backend/          the Express and MongoDB backend
src/app/api/platform/   the API the panels write through
src/app/{techboard,login,profile}   the pages
src/components/platform/   the panel components
scripts/ui-check.mjs    the browser checks
```

## Checking it

```bash
npm run check:ui
```

This drives the panels in a real browser, pressing the buttons, and
checks what came back. It covers the three roles landing on the right
panel, the navigation being there, the profile link resolving to the right
person, the old routes redirecting, the admin creating and deleting, the
smooth cursor and the particle background.

To run it against the tn backend, give it the tn demo accounts:

```bash
MENTOR_ID=smith@example.com MENTEE_ID=DEMO0001 npm run check:ui
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