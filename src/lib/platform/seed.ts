import { execute, queryOne } from "./db";
import {
  assignMentorToProgram,
  assignMenteeToProgram,
  createAdmin,
  createMentor,
  createMentee,
  createProgram,
  createResource,
} from "./store";
import type { ResourceType } from "./types";

/**
 * Seeding the platform with real data.
 *
 * The TechNeeds backend already holds the programs, mentors, resources and
 * mentees of the live platform, so the panels start against that rather
 * than against made-up rows. It is read only: the seed copies what it
 * needs and writes it into this project's own database, and it never posts
 * anything back.
 *
 * Two things are changed on the way in, and both are deliberate:
 *
 *  - credentials. The backend stores password hashes and never shows the
 *    passwords, so there is nothing to copy. Every seeded account gets the
 *    demo password below instead.
 *  - deadlines. Almost every deadline on the live platform is in the
 *    past, which would make every assignment look overdue the moment the
 *    platform came up. The schedule is shifted forward, keeping its shape.
 */

/**
 * The password every seeded account gets.
 *
 * Only applies to the accounts copied from the live platform, and only
 * until they are changed.
 */
export const DEMO_PASSWORD = "techneeds-demo";

/**
 * The live backend the seed reads from.
 */
const SOURCE = "https://tn-backend-1.onrender.com";

/**
 * How long a request to the live backend may take.
 */
const SOURCE_TIMEOUT_MS = 12000;

export interface SeedReport {
  /** The admin account that was created. */
  admin: { email: string; password: string };
  /** A mentor that can be signed into. */
  mentor: { email: string; password: string };
  /** A mentee that can be signed into. */
  mentee: { enrollmentNumber: string; password: string };
  counts: {
    programs: number;
    mentors: number;
    mentees: number;
    resources: number;
  };
  /** Set when the live backend could not be reached. */
  warning?: string;
}

/**
 * Fetches a list from the live backend.
 */
async function fetchFromSource<T>(path: string): Promise<T[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SOURCE_TIMEOUT_MS);

  try {
    const response = await fetch(`${SOURCE}${path}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`${path} returned ${response.status}`);
    const payload: unknown = await response.json();
    return Array.isArray(payload) ? (payload as T[]) : [];
  } finally {
    clearTimeout(timer);
  }
}

interface SourceProgram {
  _id: string;
  name: string;
  resources?: string[];
  createdAt?: string;
}

interface SourceMentor {
  _id: string;
  name: string;
  email: string;
  /**
   * The programs this mentor is on. The live backend fills these in with
   * the whole program rather than just its id.
   */
  programs?: ({ _id?: string } | string)[];
  createdAt?: string;
}

interface SourceMentee {
  _id: string;
  name: string;
  enrollmentNumber: string;
  /** The programs this mentee is on, as ids. */
  programs?: string[];
  totalScore?: number;
  streak?: number;
  createdAt?: string;
}

interface SourceResource {
  _id: string;
  title: string;
  description?: string;
  type?: string;
  url?: string;
  maxScore?: number;
  deadline?: string;
  program?: string;
  createdAt?: string;
}

/**
 * The live platform has three resource types plus a fourth that was never
 * part of the design. The platform publishes three kinds of work, so
 * anything that is not a quiz or a project is treated as a video.
 */
function toResourceType(type: string | undefined): ResourceType {
  if (type === "quiz" || type === "project") return type;
  return "video";
}

/**
 * Moves a deadline into the future.
 *
 * The gap between the earliest deadline and each later one is kept, and
 * the earliest one is placed a week out, so the demo has work that is
 * open, work that is due soon and work that has passed.
 */
function shiftDeadlines(deadlines: (string | null)[]): (string | null)[] {
  const dated = deadlines
    .map((value) => (value ? new Date(value).getTime() : Number.NaN))
    .filter((value) => Number.isFinite(value));

  if (dated.length === 0) return deadlines;

  const earliest = Math.min(...dated);
  const anchor = Date.now() + 1000 * 60 * 60 * 24 * 7;

  return deadlines.map((value) => {
    if (!value) return null;
    const time = new Date(value).getTime();
    if (!Number.isFinite(time)) return null;
    return new Date(anchor + (time - earliest)).toISOString();
  });
}

/**
 * Fills the platform with the live data.
 *
 * Safe to run once. It refuses to run when the platform already has
 * programs, so it cannot be triggered twice by accident.
 */
export async function seedPlatform(): Promise<SeedReport> {
  const existing = await queryOne<{ count: number }>(
    `SELECT count(*) AS count FROM programs`,
  );
  if (existing && existing.count > 0) {
    throw new Error("The platform already has programs; nothing was seeded.");
  }

  const adminEmail = "admin@techneeds.test";
  const adminPassword = "admin-demo";
  await createAdmin({
    name: "Platform Admin",
    email: adminEmail,
    password: adminPassword,
  });

  let sourcePrograms: SourceProgram[] = [];
  let sourceMentors: SourceMentor[] = [];
  const sourceMentees: SourceMentee[] = [];
  const sourceResources: SourceResource[] = [];
  let warning: string | undefined;

  try {
    sourcePrograms = await fetchFromSource<SourceProgram>("/api/programs");
    sourceMentors = await fetchFromSource<SourceMentor>("/api/mentors");

    for (const program of sourcePrograms) {
      if (!program.resources?.length) continue;
      const resources = await fetchFromSource<SourceResource>(
        `/api/${program._id}/resources`,
      );
      sourceResources.push(...resources);
    }

    const seen = new Set<string>();
    for (const program of sourcePrograms) {
      const mentees = await fetchFromSource<SourceMentee>(
        `/api/${program._id}/mentees`,
      );
      for (const mentee of mentees) {
        if (seen.has(mentee._id)) continue;
        seen.add(mentee._id);
        sourceMentees.push(mentee);
      }
    }
  } catch (error) {
    warning =
      error instanceof Error
        ? `Could not read the live platform (${error.message}). Only the demo accounts were created.`
        : "Could not read the live platform. Only the demo accounts were created.";
  }

  // --- programs ------------------------------------------------------------
  const programIds = new Map<string, string>();
  for (const program of sourcePrograms) {
    const created = await createProgram({
      name: program.name,
      description: `Copied from the live TechNeeds platform on ${new Date()
        .toISOString()
        .slice(0, 10)}.`,
      track: inferTrack(program.name),
    });
    programIds.set(program._id, created.id);
  }

  // --- mentors -------------------------------------------------------------
  const mentorIds = new Map<string, string>();
  for (const mentor of sourceMentors) {
    const { mentor: created } = await createMentor({
      name: mentor.name,
      email: mentor.email,
      title: "Mentor",
      skills: [],
      password: DEMO_PASSWORD,
    });
    mentorIds.set(mentor._id, created.id);

    for (const program of mentor.programs ?? []) {
      const programId = typeof program === "string" ? program : program._id;
      if (!programId) continue;
      const local = programIds.get(programId);
      if (local) await assignMentorToProgram(local, created.id);
    }
  }

  // --- mentees -------------------------------------------------------------
  // The mentees go in before the resources: publishing a resource assigns
  // it to everybody on the program, so the other way round nothing would
  // ever be assigned to anybody.
  const menteeIds = new Map<string, string>();
  for (const mentee of sourceMentees) {
    const { mentee: created } = await createMentee({
      name: mentee.name,
      interests: [],
      password: DEMO_PASSWORD,
      // The enrollment number the live platform already knows this person
      // by, so the copy is recognisable and the sign-in still works.
      enrollmentNumber: mentee.enrollmentNumber?.trim() || undefined,
    });
    menteeIds.set(mentee._id, created.id);

    for (const programId of mentee.programs ?? []) {
      const local = programIds.get(programId);
      if (local) await assignMenteeToProgram(local, created.id);
    }

    // The live scores carry over, so the leaderboard is not empty.
    await execute(
      `UPDATE mentees SET total_score = ?, streak = ? WHERE id = ?`,
      [mentee.totalScore ?? 0, mentee.streak ?? 0, created.id],
    );
  }

  // --- resources -----------------------------------------------------------
  const shifted = shiftDeadlines(sourceResources.map((r) => r.deadline ?? null));
  let resourceCount = 0;
  for (let index = 0; index < sourceResources.length; index++) {
    const resource = sourceResources[index];
    const programId = programIds.get(resource.program ?? "");
    if (!programId) continue;

    await createResource({
      programId,
      // A few rows on the live platform are missing their title; they
      // are still worth keeping, under a name of their own.
      title: resource.title?.trim() || "Untitled resource",
      description: resource.description ?? "",
      type: toResourceType(resource.type),
      url: resource.url ?? "",
      maxScore: resource.maxScore ?? 10,
      deadline: shifted[index] ?? null,
      tags: [],
      createdBy: "",
    });
    resourceCount++;
  }

  // --- a sign-in for each role --------------------------------------------
  const demoMentor = sourceMentors[0];
  const demoMentee = sourceMentees[0];

  return {
    admin: { email: adminEmail, password: adminPassword },
    mentor: {
      email: demoMentor?.email.toLowerCase() ?? "mentor@techneeds.test",
      password: DEMO_PASSWORD,
    },
    mentee: {
      enrollmentNumber: demoMentee?.enrollmentNumber ?? "DEMO0001",
      password: DEMO_PASSWORD,
    },
    counts: {
      programs: programIds.size,
      mentors: mentorIds.size,
      mentees: menteeIds.size,
      resources: resourceCount,
    },
    warning,
  };
}

/**
 * Guesses the subject area of a program from its name.
 *
 * The live platform does not record a track, but the names are consistent
 * enough to group on, and the track is what the recommendations are built
 * from.
 */
function inferTrack(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("web")) return "web development";
  if (lower.includes("data")) return "data science";
  if (lower.includes("ai") || lower.includes("ml")) return "machine learning";
  if (lower.includes("deep")) return "deep learning";
  if (lower.includes("dsa")) return "data structures";
  return "general";
}
