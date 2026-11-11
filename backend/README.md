# The mentorship platform backend

An Express server over MongoDB. It holds the programs, mentors, mentees,
resources, the work mentees hand in and the marks mentors give.

The frontend talks to this server when `PLATFORM_BACKEND=tn`. Without
that, the frontend keeps its own SQLite copy and never calls this.

## Running it

```bash
cd backend
npm install
cp .env.example .env      # then fill in MONGO_URI, JWT_SECRET and ADMIN_KEY
npm start
```

It listens on `http://localhost:8000` by default. `npm run dev` runs it
with nodemon instead, if you have it.

## What changed from the original

The routes the original platform had are all still here, with the same
shapes. These are the changes:

**Fixed**

- `POST /api/m/login` compared the password in the clear with the stored
  value, so a mentee whose password had been hashed could never sign in.
  It now compares properly with bcrypt, and still accepts a password that
  was stored in the clear, and hashes it the first time it is used.
- `POST /api/mentees` stored the password in the clear. It hashes it now.
- `GET /api/programs` and `GET /api/mentors` returned every mentor's
  bcrypt hash, because the mentors are embedded in a program. They do not
  any more.
- A create with a missing field answered `500` with a JavaScript error.
  It answers `400` with a message.
- A second mentor with the same email answered `500`. It answers `409`.
- `GET /api/m/dashboard` did not include the enrollment number or the
  mentee's interests, so a client could not show them. It does now.
- An unknown API route fell through to the page. It answers `404` as JSON.

**Added**

| Route | What it does |
|---|---|
| `GET /api/programs/:id` | one program |
| `PATCH /api/programs/:id` | rename it, change its track or archive it |
| `DELETE /api/programs/:id` | remove it, and the resources and progress on it |
| `DELETE /api/programs/:programId/mentors/:mentorId` | take a mentor off it |
| `GET /api/mentors/:id` | one mentor |
| `PATCH /api/mentors/:id` | change their name, title, bio or skills |
| `DELETE /api/mentors/:id` | remove them; their mentees stay on their programs |
| `GET /api/mentors/:id/mentees` | everybody they look after |
| `GET /api/mentors/:id/resources` | everything they have published |
| `GET /api/resources/:id` | one resource |
| `PATCH /api/resources/:id` | change it |
| `DELETE /api/resources/:id` | remove it |
| `GET /api/m/mentee/:id` | one mentee, for the profile page |

The deleting and editing routes need the `x-admin-key` header, which
matches `ADMIN_KEY` in the `.env`. That key is a shared secret: it never
goes to the browser, because the frontend's own API routes add it on the
server side.

The models grew a few fields the panels need: a program has a
description, a subject area and a status; a mentor has a title, a bio and
a list of skills; a mentee has a list of interests; a resource has a
description and a list of tags.

## The data

An empty database is fine. `npm run seed` fills one with a program, a
mentor and a mentee so there is something to look at, and prints the
credentials it made.
