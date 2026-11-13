# TechNeeds IGDTUW

The TechNeeds site and the mentorship platform that goes with it, rebuilt
for **Reimagathon**, a hackathon that asks teams to reimagine the TechNeeds
IGDTUW platform.

TechNeeds IGDTUW is a student technology community at Indira Gandhi Delhi
Technical University for Women, built around peer mentorship: cohorts of
mentees, each one looked after by a mentor, working through a shared set of
resources. This repository holds both halves.

**The site**: the landing page, the team, the leaderboard and the FAQs.

**The platform**: three roles on one dashboard, plus a profile for every
mentor and mentee. An admin creates the programs and onboards the mentors.
A mentor adds mentees, publishes the work, and marks what comes back. A
mentee works through what they have been set and watches their points,
their streak and their rank.

**Live:** <https://innovortex-techneeds.vercel.app>, with its backend at
<https://innovortex-techneeds-api.vercel.app> (`/api/health` answers
`{"ok":true}`).

---

## What it does

**Admin**
- Creates programs and onboards mentors. A new mentor's sign-in details are
  generated and shown once, in a pop-up that cannot be closed by accident
  until they have been saved.
- Puts mentors on programs and takes them off. Every removal or deletion
  asks for a second press.

**Mentor**
- Adds mentees to a program. Each gets an enrollment number and an initial
  password, shown once.
- Publishes resources of three kinds (video, quiz, project) with a deadline
  and a maximum score.
- Marks what comes back, seeing the work that was handed in, and when,
  above the score. The score starts empty and cannot exceed the maximum.

**Mentee**
- Signs in with an enrollment number.
- The dashboard opens on **Up next**: the one piece of work to do next,
  with a live countdown and a link straight to it. Work still to do comes
  before work that is finished.
- Videos, quizzes and projects, and marks, each have their own tab. Work due
  within two days is flagged, and overdue work too.
- Points, a streak, a place on the leaderboard, and a note of any marks
  that arrived since the last visit.

**Profile**: everybody but the admin gets one, built by a rule engine
(`src/lib/platform/ai/profile.ts`) from what the person has actually done:
an archetype, badges, a level, charts, and recommendations with the reason
for each. It is rules rather than a language model, so the same person
always gets the same profile, it needs no API key, and every claim on it
traces back to a number on the platform. An admin's profile link goes to
the dashboard instead.

**Everywhere**: a colour palette picker in the footer, keyboard focus that
can be seen, and motion that steps back for anyone who has asked their
system for reduced motion.

## Getting started

```bash
npm install
PLATFORM_BACKEND=sqlite npm run dev
```

Open <http://localhost:3000>. With `PLATFORM_BACKEND=sqlite` the platform
keeps its data in a SQLite file in `.data/` and needs nothing else
installed.

The first time, the platform needs setting up before anybody can sign in.
Open <http://localhost:3000/login> and it offers to do it: that creates the
first admin and copies the live platform's programs, mentors, mentees and
resources in. It takes about twenty seconds.

Without `PLATFORM_BACKEND=sqlite`, the app talks to the Express and MongoDB
backend instead (see [Two backends](#two-backends)).

## Signing in

Everybody signs in at `/login` and lands on `/techboard`, which shows the
panel that belongs to their role. Mentees and mentors pick their tab on the
sign-in form. **Admins sign in at `/login?as=admin`**, which the site does
not link to.

The local demo accounts the setup makes:

| Role | Sign in with | Password |
|---|---|---|
| Admin | `admin@techneeds.test` | `admin-demo` |
| Mentor | `joel2@gmail.com` | `techneeds-demo` |
| Mentee | `1234567` | `techneeds-demo` |

The mentor is the one with the most mentees and the mentee is the one with
the most work behind them, so both panels have something in them. Anything
created from the admin or mentor panel gets a password of its own, which is
shown once and never stored in the clear.

> These passwords are public. Use them for local development only, and give
> any deployed admin account a password of its own.

`/mentee`, `/mentor` and `/admin` still exist and redirect to the
techboard, so an old link lands somewhere sensible.

## Two backends

The panels ask one set of questions. Where the answers come from is an
environment variable.

| | `PLATFORM_BACKEND=tn` (the default) | `PLATFORM_BACKEND=sqlite` |
|---|---|---|
| Where the data lives | the Express and MongoDB backend in `backend/` | a SQLite file in `.data/` |
| Needs setting up | MongoDB, and `cd backend && npm install` | nothing |
| Used for | production | local development and the browser checks |

To run against the tn backend locally, in one terminal:

```bash
cd backend
npm install
cp .env.example .env      # fill in MONGO_URI, JWT_SECRET and ADMIN_KEY
npm run seed              # one program, a mentor and a mentee to sign in with
npm start
```

and in another:

```bash
TN_BACKEND_URL=http://localhost:8000 \
TN_ADMIN_KEY=<the ADMIN_KEY from backend/.env> \
npm run dev
```

The backend's own seed makes the accounts `smith@example.com` and
`DEMO0001`, both with `techneeds-demo`. Admins and sessions are kept in the
backend too, so the frontend needs no database of its own.

See [`PLATFORM.md`](PLATFORM.md) for the rest of the platform, and
[`backend/README.md`](backend/README.md) for the backend.

## Commands

```bash
npm run dev        # the app, on http://localhost:3000
npm run build      # a production build
npm start          # serve the production build
npm run lint       # eslint
npm run check:ui   # drive the panels in a real browser and check them
```

`npm run check:ui` opens Chrome, presses the buttons on all three panels
and checks what came back: each role landing on the right panel, adding a
mentee and a mentor, publishing and handing in work, removing and deleting
(with their confirmations), the navigation, the old routes redirecting, and
the profile. It creates and deletes records, so run it against the SQLite
mode, never against the live backend:

```bash
PLATFORM_BACKEND=sqlite npm run build
PLATFORM_BACKEND=sqlite npm start -- -p 3005
APP=http://localhost:3005 npm run check:ui
```

## Deploying

Both halves run on Vercel as separate projects.

**The backend** (`backend/`, an Express app; `app.js` is the entry point
and `index.js` only listens, for local runs). It is pinned to Node 24 in
`backend/package.json`: on Node 26 a dependency of `jsonwebtoken` crashes
every request. Environment variables: `MONGO_URI`, `JWT_SECRET` and
`ADMIN_KEY`.

**The frontend** (the project root). Environment variables:

| Variable | Value |
|---|---|
| `PLATFORM_BACKEND` | `tn` |
| `TN_BACKEND_URL` | the backend's URL |
| `TN_ADMIN_KEY` | the same value as the backend's `ADMIN_KEY` |

If the two keys differ, every admin request is refused and the platform
looks as if it has never been set up.

```bash
cd backend && vercel deploy --prod     # the backend
cd .. && vercel deploy --prod          # the frontend
```

## How it is put together

- **Next.js 16** with the App Router, Tailwind 4 and React 19.
- **motion** for the animation, `@tabler/icons-react` for the icons, and
  Radix for the accordion.
- **Express and MongoDB** (Mongoose) for the platform's backend.
- **SQLite** through `@libsql/client` for local development.
- **scrypt** from the Node standard library for the password hashes in the
  SQLite mode, so there is no native module to compile.

```
src/app/                 the pages and the API
src/components/          the site's sections and the platform's panels
src/lib/platform/        the data model, the store and the profile engine
src/lib/leaderboard.ts   the public leaderboard
backend/                 the Express and MongoDB backend
scripts/ui-check.mjs     the browser checks
PRODUCT.md               who the product is for and what it must keep true
plans/                   the animation audit and the plans that came out of it
```

## Two things worth knowing about Next 16

The panels read the session cookie, so they cannot be prerendered into the
static shell. Each one sits behind a `<Suspense>` boundary and is marked
`export const instant = false`, and `currentUser()` calls
`await connection()` so the render happens at request time. For the same
reason, a value that changes on its own, such as `new Date()`, cannot be
rendered into a page that is prerendered.

Dates are formatted by hand in `src/lib/platform/dates.ts` rather than with
`toLocaleDateString()`. The server and the browser do not always agree on
a locale, and when they do not, React throws a hydration error.
