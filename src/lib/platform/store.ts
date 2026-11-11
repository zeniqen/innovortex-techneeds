import { execute, query, queryOne, writeBatch } from "./db";
import {
  generateEnrollmentNumber,
  generatePassword,
  hashPassword,
  newId,
} from "./credentials";
import type {
  LeaderboardRow,
  Mentor,
  Mentee,
  Progress,
  ProgressStatus,
  Program,
  Resource,
  ResourceType,
  ResourceWithProgress,
  Role,
  ScoreEvent,
  Submission,
} from "./types";

/**
 * Every read and write the platform does.
 *
 * The panels and the API route handlers both come through here, so there
 * is one place where the shape of the data is decided.
 */

// --- admins ---------------------------------------------------------------

/**
 * Creates an admin.
 *
 * There is only ever meant to be one way in: the first admin is created
 * during setup, before anyone can sign in. After that an admin can add
 * more from the admin panel.
 */
export async function createAdmin(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ id: string; email: string }> {
  const id = newId("admin");
  await execute(
    `INSERT INTO admins (id, name, email, password_hash, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      id,
      input.name.trim(),
      input.email.trim().toLowerCase(),
      await hashPassword(input.password),
      new Date().toISOString(),
    ],
  );
  return { id, email: input.email.trim().toLowerCase() };
}

/**
 * How many admins there are.
 */
export async function adminCount(): Promise<number> {
  const row = await queryOne<{ count: number }>(
    `SELECT count(*) AS count FROM admins`,
  );
  return row?.count ?? 0;
}

/**
 * How many programs there are.
 */
export async function programCount(): Promise<number> {
  const row = await queryOne<{ count: number }>(
    `SELECT count(*) AS count FROM programs`,
  );
  return row?.count ?? 0;
}

/**
 * Empties the platform.
 *
 * Used when a seed fails part way through, so the setup can be tried
 * again from a clean state rather than on top of half a platform.
 */
export async function resetPlatform(): Promise<void> {
  await writeBatch((run) => {
    for (const table of [
      "score_events",
      "submissions",
      "progress",
      "resources",
      "mentee_programs",
      "mentor_programs",
      "mentees",
      "mentors",
      "admins",
      "programs",
      "sessions",
      "audit_log",
    ]) {
      run(`DELETE FROM ${table}`);
    }
  });
}

// --- programs -------------------------------------------------------------

export async function listPrograms(): Promise<Program[]> {
  const rows = await query<ProgramRow>(
    `SELECT * FROM programs ORDER BY status = 'archived', name COLLATE NOCASE`,
  );
  return rows.map(toProgram);
}

export async function getProgram(id: string): Promise<Program | null> {
  const row = await queryOne<ProgramRow>(`SELECT * FROM programs WHERE id = ?`, [
    id,
  ]);
  return row ? toProgram(row) : null;
}

export async function createProgram(input: {
  name: string;
  description?: string;
  track?: string;
}): Promise<Program> {
  const now = new Date().toISOString();
  const id = newId("prog");
  await execute(
    `INSERT INTO programs (id, name, description, track, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'active', ?, ?)`,
    [
      id,
      input.name.trim(),
      input.description?.trim() ?? "",
      input.track?.trim() || "general",
      now,
      now,
    ],
  );
  const program = await getProgram(id);
  if (!program) throw new Error("program disappeared after creation");
  return program;
}

export async function updateProgram(
  id: string,
  patch: Partial<Pick<Program, "name" | "description" | "track" | "status">>,
): Promise<Program | null> {
  const current = await getProgram(id);
  if (!current) return null;

  await execute(
    `UPDATE programs
        SET name = ?, description = ?, track = ?, status = ?, updated_at = ?
      WHERE id = ?`,
    [
      patch.name?.trim() || current.name,
      patch.description?.trim() ?? current.description,
      patch.track?.trim() || current.track,
      patch.status ?? current.status,
      new Date().toISOString(),
      id,
    ],
  );
  return getProgram(id);
}

// --- mentors --------------------------------------------------------------

export async function listMentors(): Promise<Mentor[]> {
  const rows = await query<MentorRow>(`SELECT * FROM mentors ORDER BY name COLLATE NOCASE`);
  const mentors: Mentor[] = [];
  for (const row of rows) {
    mentors.push({
      id: row.id,
      name: row.name,
      email: row.email,
      title: row.title,
      bio: row.bio,
      skills: parseList(row.skills),
      programIds: await programIdsFor("mentor", row.id),
      createdAt: row.created_at,
    });
  }
  return mentors;
}

export async function getMentor(id: string): Promise<Mentor | null> {
  const row = await queryOne<MentorRow>(`SELECT * FROM mentors WHERE id = ?`, [id]);
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    title: row.title,
    bio: row.bio,
    skills: parseList(row.skills),
    programIds: await programIdsFor("mentor", row.id),
    createdAt: row.created_at,
  };
}

/**
 * Onboards a mentor and returns the credentials to hand over.
 *
 * The password is generated here and never stored in the clear, so it is
 * shown once and then only its hash remains.
 */
export async function createMentor(input: {
  name: string;
  email: string;
  title?: string;
  bio?: string;
  skills?: string[];
  programIds?: string[];
  /**
   * The password to set. One is generated when this is left out, which is
   * what the admin panel does: the password is shown once and never
   * stored in the clear.
   */
  password?: string;
}): Promise<{ mentor: Mentor; password: string }> {
  const password = input.password ?? generatePassword();
  const id = newId("mentor");
  const now = new Date().toISOString();

  await execute(
    `INSERT INTO mentors (id, name, email, password_hash, title, bio, skills, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name.trim(),
      input.email.trim().toLowerCase(),
      await hashPassword(password),
      input.title?.trim() || "Mentor",
      input.bio?.trim() ?? "",
      JSON.stringify(input.skills ?? []),
      now,
      now,
    ],
  );

  for (const programId of input.programIds ?? []) {
    await assignMentorToProgram(programId, id);
  }

  const mentor = await getMentor(id);
  if (!mentor) throw new Error("mentor disappeared after creation");
  return { mentor, password };
}

export async function assignMentorToProgram(
  programId: string,
  mentorId: string,
): Promise<void> {
  await execute(
    `INSERT OR IGNORE INTO mentor_programs (mentor_id, program_id) VALUES (?, ?)`,
    [mentorId, programId],
  );
}

export async function removeMentorFromProgram(
  programId: string,
  mentorId: string,
): Promise<void> {
  await execute(
    `DELETE FROM mentor_programs WHERE mentor_id = ? AND program_id = ?`,
    [mentorId, programId],
  );
}

export async function listMentorsForProgram(
  programId: string,
): Promise<Mentor[]> {
  const rows = await query<MentorRow>(
    `SELECT mentors.* FROM mentors
       JOIN mentor_programs ON mentor_programs.mentor_id = mentors.id
      WHERE mentor_programs.program_id = ?
      ORDER BY mentors.name COLLATE NOCASE`,
    [programId],
  );
  const mentors: Mentor[] = [];
  for (const row of rows) {
    mentors.push({
      id: row.id,
      name: row.name,
      email: row.email,
      title: row.title,
      bio: row.bio,
      skills: parseList(row.skills),
      programIds: await programIdsFor("mentor", row.id),
      createdAt: row.created_at,
    });
  }
  return mentors;
}

// --- mentees --------------------------------------------------------------

export async function listMentees(): Promise<Mentee[]> {
  const rows = await query<MenteeRow>(
    `SELECT * FROM mentees ORDER BY total_score DESC, name COLLATE NOCASE`,
  );
  const mentees: Mentee[] = [];
  for (const row of rows) {
    mentees.push({
      id: row.id,
      name: row.name,
      enrollmentNumber: row.enrollment_number,
      bio: row.bio,
      interests: parseList(row.interests),
      totalScore: row.total_score,
      streak: row.streak,
      programIds: await programIdsFor("mentee", row.id),
      createdAt: row.created_at,
      lastActiveAt: row.last_active_at,
    });
  }
  return mentees;
}

export async function getMentee(id: string): Promise<Mentee | null> {
  const row = await queryOne<MenteeRow>(`SELECT * FROM mentees WHERE id = ?`, [id]);
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    enrollmentNumber: row.enrollment_number,
    bio: row.bio,
    interests: parseList(row.interests),
    totalScore: row.total_score,
    streak: row.streak,
    programIds: await programIdsFor("mentee", row.id),
    createdAt: row.created_at,
    lastActiveAt: row.last_active_at,
  };
}

export async function listMenteesForProgram(programId: string): Promise<Mentee[]> {
  const rows = await query<MenteeRow>(
    `SELECT mentees.* FROM mentees
       JOIN mentee_programs ON mentee_programs.mentee_id = mentees.id
      WHERE mentee_programs.program_id = ?
      ORDER BY mentees.name COLLATE NOCASE`,
    [programId],
  );
  const mentees: Mentee[] = [];
  for (const row of rows) {
    mentees.push({
      id: row.id,
      name: row.name,
      enrollmentNumber: row.enrollment_number,
      bio: row.bio,
      interests: parseList(row.interests),
      totalScore: row.total_score,
      streak: row.streak,
      programIds: await programIdsFor("mentee", row.id),
      createdAt: row.created_at,
      lastActiveAt: row.last_active_at,
    });
  }
  return mentees;
}

/**
 * Adds a mentee and returns the credentials to hand over.
 *
 * The enrollment number and the initial password are generated here and
 * never stored in the clear.
 */
export async function createMentee(input: {
  name: string;
  bio?: string;
  interests?: string[];
  programIds?: string[];
  /**
   * The enrollment number to give this mentee. One is generated when this
   * is left out, which is what the mentor panel does: the number and the
   * password are shown once and never stored in the clear.
   */
  enrollmentNumber?: string;
  /**
   * The password to set. One is generated when this is left out, which is
   * what the mentor panel does: the password is shown once and never
   * stored in the clear.
   */
  password?: string;
}): Promise<{ mentee: Mentee; enrollmentNumber: string; password: string }> {
  const taken = await queryOne<{ ids: string }>(
    `SELECT group_concat(enrollment_number) AS ids FROM mentees`,
  );
  const used = (taken?.ids ?? "").split(",").filter(Boolean);

  const enrollmentNumber =
    input.enrollmentNumber?.trim().toUpperCase() ||
    generateEnrollmentNumber(used);

  if (used.includes(enrollmentNumber)) {
    throw new Error("That enrollment number is already in use.");
  }

  const password = input.password ?? generatePassword();
  const id = newId("mentee");
  const now = new Date().toISOString();

  await execute(
    `INSERT INTO mentees
       (id, name, enrollment_number, password_hash, bio, interests,
        total_score, streak, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`,
    [
      id,
      input.name.trim(),
      enrollmentNumber,
      await hashPassword(password),
      input.bio?.trim() ?? "",
      JSON.stringify(input.interests ?? []),
      now,
      now,
    ],
  );

  for (const programId of input.programIds ?? []) {
    await assignMenteeToProgram(programId, id);
  }

  const mentee = await getMentee(id);
  if (!mentee) throw new Error("mentee disappeared after creation");
  return { mentee, enrollmentNumber, password };
}

export async function assignMenteeToProgram(
  programId: string,
  menteeId: string,
): Promise<void> {
  await execute(
    `INSERT OR IGNORE INTO mentee_programs (mentee_id, program_id) VALUES (?, ?)`,
    [menteeId, programId],
  );
}

export async function removeMenteeFromProgram(
  programId: string,
  menteeId: string,
): Promise<void> {
  await execute(
    `DELETE FROM mentee_programs WHERE mentee_id = ? AND program_id = ?`,
    [menteeId, programId],
  );
}

// --- resources ------------------------------------------------------------

export async function listResources(programId: string): Promise<Resource[]> {
  const rows = await query<ResourceRow>(
    `SELECT * FROM resources WHERE program_id = ? ORDER BY created_at`,
    [programId],
  );
  return rows.map(toResource);
}

export async function getResource(id: string): Promise<Resource | null> {
  const row = await queryOne<ResourceRow>(`SELECT * FROM resources WHERE id = ?`, [
    id,
  ]);
  return row ? toResource(row) : null;
}

export async function createResource(input: {
  programId: string;
  title: string;
  description?: string;
  type: ResourceType;
  url?: string;
  maxScore?: number;
  deadline?: string | null;
  tags?: string[];
  createdBy?: string;
}): Promise<Resource> {
  const id = newId("res");
  const now = new Date().toISOString();

  await execute(
    `INSERT INTO resources
       (id, program_id, title, description, type, url, max_score, deadline,
        tags, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.programId,
      input.title.trim(),
      input.description?.trim() ?? "",
      input.type,
      input.url?.trim() ?? "",
      Math.max(0, Math.round(input.maxScore ?? 0)),
      input.deadline ?? null,
      JSON.stringify(input.tags ?? []),
      input.createdBy ?? "",
      now,
      now,
    ],
  );

  // Every mentee in the program starts with this resource assigned.
  const mentees = await listMenteesForProgram(input.programId);
  for (const mentee of mentees) {
    await execute(
      `INSERT OR IGNORE INTO progress (mentee_id, resource_id, status)
       VALUES (?, ?, 'assigned')`,
      [mentee.id, id],
    );
  }

  const resource = await getResource(id);
  if (!resource) throw new Error("resource disappeared after creation");
  return resource;
}

export async function updateResource(
  id: string,
  patch: Partial<
    Pick<
      Resource,
      "title" | "description" | "type" | "url" | "maxScore" | "deadline" | "tags"
    >
  >,
): Promise<Resource | null> {
  const current = await getResource(id);
  if (!current) return null;

  await execute(
    `UPDATE resources
        SET title = ?, description = ?, type = ?, url = ?, max_score = ?,
            deadline = ?, tags = ?, updated_at = ?
      WHERE id = ?`,
    [
      patch.title?.trim() || current.title,
      patch.description?.trim() ?? current.description,
      patch.type ?? current.type,
      patch.url?.trim() ?? current.url,
      Math.max(0, Math.round(patch.maxScore ?? current.maxScore)),
      patch.deadline === undefined ? current.deadline : patch.deadline,
      patch.tags ? JSON.stringify(patch.tags) : JSON.stringify(current.tags),
      new Date().toISOString(),
      id,
    ],
  );
  return getResource(id);
}

export async function deleteResource(id: string): Promise<void> {
  await execute(`DELETE FROM resources WHERE id = ?`, [id]);
}

// --- progress and submissions ---------------------------------------------

export async function getProgress(
  menteeId: string,
  resourceId: string,
): Promise<Progress | null> {
  const row = await queryOne<ProgressRow>(
    `SELECT * FROM progress WHERE mentee_id = ? AND resource_id = ?`,
    [menteeId, resourceId],
  );
  return row ? toProgress(row) : null;
}

/**
 * The resources a mentee has been assigned, with their progress.
 */
export async function listMenteeResources(
  menteeId: string,
): Promise<ResourceWithProgress[]> {
  const rows = await query<ResourceRow & { progress_status: string | null }>(
    `SELECT resources.*, progress.status AS progress_status
       FROM resources
       JOIN mentee_programs ON mentee_programs.program_id = resources.program_id
       JOIN progress ON progress.resource_id = resources.id
                       AND progress.mentee_id = mentee_programs.mentee_id
      WHERE mentee_programs.mentee_id = ?
      ORDER BY resources.created_at`,
    [menteeId],
  );

  const now = Date.now();
  const resources: ResourceWithProgress[] = [];
  for (const row of rows) {
    const progress = await getProgress(menteeId, row.id);
    resources.push({
      ...toResource(row),
      progress,
      submission: await getSubmission(menteeId, row.id),
      overdue:
        row.deadline !== null &&
        new Date(row.deadline).getTime() < now &&
        progress?.status !== "graded",
    });
  }
  return resources;
}

/**
 * The resources a mentor has published, with how each mentee is getting on.
 */
export async function listMentorResourceProgress(
  mentorId: string,
  programId: string,
): Promise<{
  resource: Resource;
  entries: { mentee: Mentee; progress: Progress | null }[];
}[]> {
  const resources = await listResources(programId);
  const mentees = await listMenteesForProgram(programId);
  const result = [];

  for (const resource of resources) {
    const entries = [] as { mentee: Mentee; progress: Progress | null }[];
    for (const mentee of mentees) {
      entries.push({
        mentee,
        progress: await getProgress(mentee.id, resource.id),
      });
    }
    result.push({ resource, entries });
  }

  return result;
}

export async function getSubmission(
  menteeId: string,
  resourceId: string,
): Promise<Submission | null> {
  const row = await queryOne<SubmissionRow>(
    `SELECT * FROM submissions WHERE mentee_id = ? AND resource_id = ?`,
    [menteeId, resourceId],
  );
  if (!row) return null;
  return {
    id: row.id,
    menteeId: row.mentee_id,
    resourceId: row.resource_id,
    body: row.body,
    submittedAt: row.submitted_at,
  };
}

/**
 * Records that a mentee started a resource.
 */
export async function startResource(
  menteeId: string,
  resourceId: string,
): Promise<void> {
  const now = new Date().toISOString();
  await execute(
    `INSERT INTO progress (mentee_id, resource_id, status, started_at)
     VALUES (?, ?, 'in_progress', ?)
     ON CONFLICT(mentee_id, resource_id) DO UPDATE SET
       status = CASE WHEN progress.status = 'assigned' THEN 'in_progress'
                     ELSE progress.status END,
       started_at = COALESCE(progress.started_at, ?)`,
    [menteeId, resourceId, now, now],
  );
  await touchMentee(menteeId, now);
}

/**
 * Submits work on a resource.
 */
export async function submitResource(
  menteeId: string,
  resourceId: string,
  body: string,
): Promise<void> {
  const now = new Date().toISOString();

  await writeBatch(async (run) => {
    await run(
      `INSERT INTO submissions (id, mentee_id, resource_id, body, submitted_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(mentee_id, resource_id) DO UPDATE SET
         body = excluded.body,
         submitted_at = excluded.submitted_at`,
      [newId("sub"), menteeId, resourceId, body, now],
    );
    await run(
      `INSERT INTO progress (mentee_id, resource_id, status, submitted_at)
       VALUES (?, ?, 'submitted', ?)
       ON CONFLICT(mentee_id, resource_id) DO UPDATE SET
         status = 'submitted',
         submitted_at = ?`,
      [menteeId, resourceId, now, now],
    );
  });

  await touchMentee(menteeId, now);
}

/**
 * Grades a submission and moves the mentee's score.
 *
 * The score is recorded as an event rather than written straight onto the
 * mentee, so the difference between the two grades can be taken back out
 * if a mentor corrects one.
 */
export async function gradeResource(input: {
  menteeId: string;
  resourceId: string;
  score: number;
  feedback?: string;
  reason?: string;
}): Promise<void> {
  const resource = await getResource(input.resourceId);
  if (!resource) throw new Error("no such resource");

  const existing = await getProgress(input.menteeId, input.resourceId);
  const score = Math.max(0, Math.min(resource.maxScore, Math.round(input.score)));
  const delta = score - (existing?.score ?? 0);
  const now = new Date().toISOString();

  await writeBatch(async (run) => {
    await run(
      `INSERT INTO progress
         (mentee_id, resource_id, status, score, submitted_at, graded_at, feedback)
       VALUES (?, ?, 'graded', ?, ?, ?, ?)
       ON CONFLICT(mentee_id, resource_id) DO UPDATE SET
         status = 'graded',
         score = excluded.score,
         graded_at = excluded.graded_at,
         feedback = excluded.feedback`,
      [
        input.menteeId,
        input.resourceId,
        score,
        existing?.submittedAt ?? now,
        now,
        input.feedback ?? "",
      ],
    );

    await run(
      `INSERT INTO score_events (id, mentee_id, resource_id, delta, reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        newId("score"),
        input.menteeId,
        input.resourceId,
        delta,
        input.reason ?? `Graded ${resource.title}`,
        now,
      ],
    );

    await run(
      `UPDATE mentees
          SET total_score = total_score + ?, updated_at = ?
        WHERE id = ?`,
      [delta, now, input.menteeId],
    );
  });

  await touchMentee(input.menteeId, now);
}

/**
 * Records that a mentee was active, and grows their streak if they were not
 * active today already.
 */
async function touchMentee(menteeId: string, now: string): Promise<void> {
  const row = await queryOne<{ last_active_at: string | null }>(
    `SELECT last_active_at FROM mentees WHERE id = ?`,
    [menteeId],
  );
  if (!row) return;

  const today = now.slice(0, 10);
  const lastDay = row.last_active_at?.slice(0, 10);
  if (lastDay === today) {
    await execute(`UPDATE mentees SET updated_at = ? WHERE id = ?`, [
      now,
      menteeId,
    ]);
    return;
  }

  await execute(
    `UPDATE mentees SET streak = streak + 1, last_active_at = ?, updated_at = ?
      WHERE id = ?`,
    [now, now, menteeId],
  );
}

// --- scores and the leaderboard ------------------------------------------

export async function scoreEventsFor(menteeId: string): Promise<ScoreEvent[]> {
  const rows = await query<ScoreEventRow>(
    `SELECT * FROM score_events WHERE mentee_id = ? ORDER BY created_at DESC`,
    [menteeId],
  );
  return rows.map((row) => ({
    id: row.id,
    menteeId: row.mentee_id,
    resourceId: row.resource_id,
    delta: row.delta,
    reason: row.reason,
    createdAt: row.created_at,
  }));
}

/**
 * The leaderboard.
 *
 * Ranked by score, with the streak and then the name as tie breakers so
 * the order is stable between two requests.
 */
export async function leaderboard(limit = 50): Promise<LeaderboardRow[]> {
  const rows = await query<{
    id: string;
    name: string;
    total_score: number;
    streak: number;
  }>(
    `SELECT id, name, total_score, streak
       FROM mentees
      ORDER BY total_score DESC, streak DESC, name COLLATE NOCASE
      LIMIT ?`,
    [limit],
  );

  return rows.map((row, index) => ({
    rank: index + 1,
    id: row.id,
    name: row.name,
    totalScore: row.total_score,
    streak: row.streak,
  }));
}

// --- audit ----------------------------------------------------------------

export async function audit(input: {
  actorId?: string;
  actorRole?: Role;
  action: string;
  subject?: string;
  detail?: string;
}): Promise<void> {
  await execute(
    `INSERT INTO audit_log (id, actor_id, actor_role, action, subject, detail, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      newId("audit"),
      input.actorId ?? "",
      input.actorRole ?? "",
      input.action,
      input.subject ?? "",
      input.detail ?? "",
      new Date().toISOString(),
    ],
  );
}

export async function recentAudit(limit = 25): Promise<
  {
    id: string;
    actorRole: string;
    action: string;
    subject: string;
    detail: string;
    createdAt: string;
  }[]
> {
  const rows = await query<{
    id: string;
    actor_role: string;
    action: string;
    subject: string;
    detail: string;
    created_at: string;
  }>(`SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?`, [limit]);

  return rows.map((row) => ({
    id: row.id,
    actorRole: row.actor_role,
    action: row.action,
    subject: row.subject,
    detail: row.detail,
    createdAt: row.created_at,
  }));
}

// --- helpers --------------------------------------------------------------

async function programIdsFor(
  role: "mentor" | "mentee",
  userId: string,
): Promise<string[]> {
  const table = role === "mentor" ? "mentor_programs" : "mentee_programs";
  const column = role === "mentor" ? "mentor_id" : "mentee_id";
  const row = await queryOne<{ ids: string }>(
    `SELECT group_concat(program_id) AS ids FROM ${table} WHERE ${column} = ?`,
    [userId],
  );
  if (!row?.ids) return [];
  return row.ids.split(",").filter(Boolean);
}

function parseList(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

interface ProgramRow {
  id: string;
  name: string;
  description: string;
  track: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface MentorRow {
  id: string;
  name: string;
  email: string;
  title: string;
  bio: string;
  skills: string;
  created_at: string;
}

interface MenteeRow {
  id: string;
  name: string;
  enrollment_number: string;
  bio: string;
  interests: string;
  total_score: number;
  streak: number;
  last_active_at: string | null;
  created_at: string;
}

interface ResourceRow {
  id: string;
  program_id: string;
  title: string;
  description: string;
  type: string;
  url: string;
  max_score: number;
  deadline: string | null;
  tags: string;
  created_by: string;
  created_at: string;
}

interface ProgressRow {
  mentee_id: string;
  resource_id: string;
  status: string;
  score: number;
  started_at: string | null;
  submitted_at: string | null;
  graded_at: string | null;
  feedback: string;
}

interface SubmissionRow {
  id: string;
  mentee_id: string;
  resource_id: string;
  body: string;
  submitted_at: string;
}

interface ScoreEventRow {
  id: string;
  mentee_id: string;
  resource_id: string | null;
  delta: number;
  reason: string;
  created_at: string;
}

function toProgram(row: ProgramRow): Program {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    track: row.track,
    status: row.status === "archived" ? "archived" : "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toResource(row: ResourceRow): Resource {
  return {
    id: row.id,
    programId: row.program_id,
    title: row.title,
    description: row.description,
    type: (row.type as ResourceType) ?? "video",
    url: row.url,
    maxScore: row.max_score,
    deadline: row.deadline,
    tags: parseList(row.tags),
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function toProgress(row: ProgressRow): Progress {
  return {
    menteeId: row.mentee_id,
    resourceId: row.resource_id,
    status: (row.status as ProgressStatus) ?? "assigned",
    score: row.score,
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
    gradedAt: row.graded_at,
    feedback: row.feedback,
  };
}
