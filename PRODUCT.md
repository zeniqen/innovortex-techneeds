# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The work is judged first. This is a submission to Reimagathon, a redesign
challenge: reimagine the existing TechNeeds IGDTUW platform
(https://techneedsigdtuw.vercel.app) as a modern, production-ready site, with
backend extensions as a bonus. The judges are the first audience, and they
score the redesign against the original: every surface should make the
scored criteria, and the change from the old site, easy to see.

Inside the product, the people who use it most are **mentees on laptops**:
students of Indira Gandhi Delhi Technical University for Women watching
videos, sitting quizzes and handing in projects for a mentorship cohort,
then checking their marks and their rank.

Mentors (seniors who run a cohort: adding mentees, publishing work,
marking it) and admins (organisers who create programs and onboard
mentors) are confirmed roles. How much they use phones was not
established; treat laptop as the primary context for all three roles.

## Product Purpose

TechNeeds IGDTUW is a student technology community built around peer
mentorship ("all_you_need_to_know_about_tech"). This product is its site
and its mentorship platform in one: the public landing page, and three
role panels (admin, mentor, mentee) plus a profile page for every mentor
and mentee.

Success is scored by the Reimagathon brief, out of 40:

| Criterion | Marks |
|---|---|
| Frontend UI/UX and redesign creativity | 10 |
| User role flow and multi-panel integration | 10 |
| AI profile feature and innovation | 8 |
| Backend integration and functionality (bonus) | 7 |
| Code quality, responsiveness and presentation | 5 |

## Positioning

The profile is worked out from what a person has actually done (work
finished, marks, rank, streak, stated interests) and every claim on it can
be traced back to a number on the platform. The engine is a set of rules
rather than a language model, so the same person always gets the same
profile, it costs nothing to serve, and it needs no key
(`src/lib/platform/ai/profile.ts`). The brief scores this as the "AI
profile"; an LLM could sit in front of it later with the same output shape.

## Operating Context

- **Admin** creates programs and onboards mentors, each mentor getting
  generated sign-in details shown once.
- **Mentor** adds mentees to a program (an enrollment number and initial
  password are generated and shown once), publishes resources of three
  kinds (video, quiz, project) with a deadline and a maximum score, and
  marks what is handed in.
- **Mentee** signs in with the enrollment number, works through what was
  set before its deadline, earns points, keeps a streak and competes on
  the leaderboard.
- Everyone signs in at `/login`; the signed-in dashboard for every role is
  `/techboard`.

## Capabilities and Constraints

- Next.js 16 app (App Router) on Vercel, with an Express and MongoDB
  backend (`backend/`) deployed separately on Vercel. The frontend uses it
  when `PLATFORM_BACKEND=tn`, which is how production runs; a local SQLite
  mode exists for development.
- The admin sign-in is deliberately not offered on the public `/login`
  page; it lives at `/login?as=admin`. That hides it but does not secure
  it: the admin password is the protection.
- Admins have no profile of their own; their profile link goes to the
  techboard.
- The brief forbids changing the organisers' original repository; this is
  the team's own repository.
- The brief makes it mandatory for every participant to redeem the Render
  credits linked in it for the submission to count.
- Reduced motion is honoured throughout the existing motion: it is a
  standing requirement for any new motion.

## Brand Commitments

- Name: **TechNeeds IGDTUW**, the community of Indira Gandhi Delhi Technical
  University for Women. Logo at `public/assets/logo.png`.
- For students: the platform must not feel dull, boring, generic or
  lethargic (the user's own words for the mentee techboard and profile).

## Evidence on Hand

- Community numbers on the landing page are real, from TechNeeds: 1,200+
  trained mentees, 50+ professional mentors, 10+ mentorship cohorts, 100+
  events.
- The named student testimonials on the landing page
  (`src/components/3d-marquee-demo.tsx`) are real.
- The cohort tracks (Web Development, C/C++ DSA, AI/ML and GenAI, Open
  Source) and the event types (hackathons including 24-hour ones, speaker
  series, coding contests, workshops) are real, as is the FAQ copy about
  seniors who cracked top internships.
- The cohort photos on the landing page are Unsplash stock photography
  (free under the Unsplash License), standing in for real cohort photos the
  team does not have yet. They illustrate; they are not evidence.
- Live platform data (programs, mentors, mentees, resources, marks) is in
  the deployed backend's MongoDB.
- Photos and illustrations in `public/assets/`.
- Not on hand, and not to be invented: endorsements from companies,
  outcome statistics (placements, offers) and any further testimonials.

## Product Principles

1. **Make the scored criteria legible.** A judge should see the role
   flows, the AI profile and the backend working without being told where
   to look.
2. **Every number is real.** Profile claims, stats and proof trace back to
   platform data or confirmed TechNeeds facts; nothing is fabricated.
3. **Lively, not slow.** Students should feel momentum, but liveliness
   never costs speed: frequent actions stay instant and motion respects
   reduced-motion settings.
4. **One platform, three roles.** Admin, mentor and mentee share one
   dashboard (`/techboard`) and one visual language; each sees only what
   their role needs.
