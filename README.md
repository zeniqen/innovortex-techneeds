# TechNeeds IGDTUW

The TechNeeds site and the mentorship platform that goes with it.

TechNeeds IGDTUW is a student technology community built around peer
mentorship: cohorts of mentees, each one looked after by a mentor, working
through a shared set of resources. This repository holds both halves.

**The site** — a Next.js 16 app: the landing page, the team, the
leaderboard, the FAQs, and the techboard, where somebody signs in and
finds out which panel is theirs.

**The platform** — three panels and a profile page, over a choice of two
backends. An admin creates the programs and onboards the mentors. A mentor
adds mentees, publishes the work, and marks what comes back. A mentee
works through what they have been set and watches their score and their
rank. Everybody gets a profile that turns what they have actually done into
something worth looking at.

---

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The site is there to be looked at.

The platform needs setting up before anybody can sign in. Open
<http://localhost:3000/login> and it will offer to do it: that creates the
first admin and copies the live platform in — 17 programs, 26 mentors, 32
mentees and 32 resources. It takes about twenty seconds, because the live
backend is on a free tier and goes to sleep when nobody is using it.

## Signing in

Three accounts, one per panel. All of them are made by the setup.

| Panel | Sign in with | Password | What you see |
|---|---|---|---|
| `/admin` | `admin@techneeds.test` | `admin-demo` | 17 programs, 26 mentors, 32 mentees |
| `/mentor` | `joel2@gmail.com` | `techneeds-demo` | 16 mentees, 20 resources, 166 points earned |
| `/mentee` | `1234567` | `techneeds-demo` | 20 pieces of work, 16 marked, rank #1 of 32 |

The mentor is the one with the most mentees and the mentee is the one with
the most work behind them, so both panels have something in them.

`1234567` is Vidushi, who is top of the leaderboard with 166 points, so the
profile, the badges and the recommendations are all populated. `238OHF` is
another Vidushi with nothing marked yet, if you want to see the empty
state.

Every seeded account shares the password `techneeds-demo`. Anything you
create from the admin or mentor panel gets a password of its own, which is
shown once and never stored in the clear.

## The panels

They are not pages of their own. `/techboard` shows you the panel that
belongs to your role:

- a **mentee** gets their work, their scores and their rank
- a **mentor** gets their mentees, the resources they have published, and
  the work waiting to be marked
- an **admin** gets the programs, the mentors and the people on them

`/mentee`, `/mentor` and `/admin` still exist and redirect to the
techboard, so an old link lands somewhere sensible. Every page keeps the
site's own navigation, so a signed-in person can reach their profile, the
leaderboard, the FAQs, the home page and the team page without signing
out.

## Two backends

The panels ask one set of questions. Where the answers come from is an
environment variable.

| | `PLATFORM_BACKEND=sqlite` (the default) | `PLATFORM_BACKEND=tn` |
|---|---|---|
| Where the data lives | a SQLite file in `.data/` | the Express and MongoDB backend in `backend/` |
| Needs setting up | nothing | MongoDB, and `cd backend && npm install` |
| Works on a serverless host | with `DATABASE_URL` pointing at Turso | if the MongoDB is reachable |

The SQLite one is the default because it works with one command and
nothing installed. The tn one is there so the panels can run against the
backend that came with the platform.

To run against the tn backend, in one terminal:

```bash
cd backend
npm install
cp .env.example .env      # fill in MONGO_URI, JWT_SECRET and ADMIN_KEY
npm run seed              # one program, a mentor and a mentee to sign in with
npm start
```

and in another:

```bash
PLATFORM_BACKEND=tn \
TN_BACKEND_URL=http://localhost:8000 \
TN_ADMIN_KEY=the ADMIN_KEY from backend/.env \
npm run dev
```

The demo accounts there are `smith@example.com` and `DEMO0001`, both with
`techneeds-demo` — the backend's own seed makes those. The admin is still
`admin@techneeds.test`, because the tn backend has no admin role: an admin
is the person who runs the platform rather than a person in it.

See [`PLATFORM.md`](PLATFORM.md) for the rest of the platform, and
[`backend/README.md`](backend/README.md) for what was changed in the
backend and why.

## Commands

```bash
npm run dev        # the app, on http://localhost:3000
npm run build      # a production build
npm start          # serve the production build
npm run lint       # eslint
npm run check:ui   # drive the panels in a real browser and check them
```

`npm run check:ui` opens Chrome, presses the buttons on all three panels
and checks what came back: the three roles landing on the right panel, the
navigation being there, the profile link resolving to the right person,
the old routes redirecting, the admin creating and deleting, and the custom
cursor and the particle background.

To run it against the tn backend, give it the tn accounts:

```bash
MENTOR_ID=smith@example.com MENTEE_ID=DEMO0001 npm run check:ui
```

## Deploying

The app needs somewhere to run and a database to keep.

```bash
npm run build
npm start
```

For the database, set `DATABASE_URL` to a remote libSQL/Turso database in
the SQLite mode, or point `TN_BACKEND_URL` at the tn backend in the tn
mode. The local file in `.data/` does not survive a serverless host.

## How it is put together

- **Next.js 16** with the App Router, Tailwind 4, React 19.
- **motion** for the animation, `@tabler/icons-react` for the icons, and
  Radix for the accordion.
- **SQLite** through `@libsql/client`, which is the same database as a
  file on disk and a remote libSQL database.
- **scrypt** from the Node standard library for the password hashes, so
  there is no native module to compile.

```
src/app/                 the pages and the API
src/components/          the site's sections and the platform's panels
src/lib/platform/        the data model, the store and the profile engine
src/lib/leaderboard.ts   the public leaderboard
backend/                 the Express and MongoDB backend
scripts/ui-check.mjs     the browser checks
plans/                   the animation audit and the plans that came out of it
```

## Two things worth knowing about Next 16

The panels read the session cookie, so they cannot be prerendered into the
static shell. Each one sits behind a `<Suspense>` boundary and is marked
`export const instant = false`, and `currentUser()` calls
`await connection()` so the render happens at request time.

Dates are formatted by hand in `src/lib/platform/dates.ts` rather than with
`toLocaleDateString()`. The server and the browser do not always agree on
a locale, and when they do not, React throws a hydration error.
