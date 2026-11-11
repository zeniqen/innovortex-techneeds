import { cookies } from "next/headers";
import { createHash } from "node:crypto";

import {
  generateEnrollmentNumber,
  generatePassword,
} from "../credentials";
import { SESSION_COOKIE } from "../session-cookie";
import { queryOne } from "../db";
import type {
  LeaderboardRow,
  Mentee,
  Mentor,
  Progress,
  Program,
  Resource,
  ResourceWithProgress,
  ScoreEvent,
  Submission,
} from "../types";

/**
 * The tn backend.
 *
 * This is the Express and MongoDB server that came with the platform,
 * reached over HTTP. It holds the programs, mentors, mentees, resources,
 * the work mentees hand in and the marks mentors give.
 *
 * The two backends answer the same questions, so the panels do not know
 * which one they are using. What the tn backend does not have is this
 * project's own notion of an admin, so the admin key is sent with the
 * writes that need one.
 */

/**
 * Where the tn backend is.
 */
const BASE = (
  process.env.TN_BACKEND_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

/**
 * The key the admin writes need. It never reaches the browser: the
 * frontend's own API routes add it on the server side.
 */
const ADMIN_KEY = process.env.TN_ADMIN_KEY ?? process.env.ADMIN_KEY ?? "";

/**
 * A request to the tn backend.
 */
export async function tnCall<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string;
    admin?: boolean;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.token) headers["x-auth-token"] = options.token;
  if (options.admin && ADMIN_KEY) headers["x-admin-key"] = ADMIN_KEY;

  const request = () =>
    fetch(`${BASE}${path}`, {
      method: options.method ?? "GET",
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
    });

  let response: Response;
  try {
    response = await request();
  } catch (error) {
    // A dropped connection should not take a whole panel down with it, so
    // it is tried once more before giving up.
    await new Promise((resolve) => setTimeout(resolve, 250));
    try {
      response = await request();
    } catch {
      throw new Error(
        `Could not reach the platform backend at ${BASE}: ${
          error instanceof Error ? error.message : "the connection failed"
        }`,
      );
    }
  }

  const text = await response.text();
  const payload: unknown = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `The platform backend answered ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

/**
 * The token of whoever is signed in.
 *
 * The tn backend wants the same token it issued, so it is kept with the
 * session.
 */
async function sessionToken(): Promise<string | undefined> {
  const store = await cookies();
  const session = store.get(SESSION_COOKIE)?.value;
  if (!session) return undefined;

  const row = await queryOne<{ token: string | null }>(
    `SELECT token FROM sessions WHERE id = ?`,
    [createHash("sha256").update(session).digest("hex")],
  );
  return row?.token ?? undefined;
}

/**
 * The document shapes the tn backend answers with.
 */
interface TnMentor {
  _id: string;
  name: string;
  email: string;
  title?: string;
  bio?: string;
  skills?: string[];
  programs?: ({ _id: string } | string)[];
  createdAt?: string;
}

interface TnProgram {
  _id: string;
  name: string;
  description?: string;
  track?: string;
  status?: string;
  resources?: (string | { _id: string })[];
  mentors?: (TnMentor | string)[];
  createdAt?: string;
}

interface TnResource {
  _id: string;
  title?: string;
  /** The name the resource had before the model was changed. */
  heading?: string;
  type?: "video" | "quiz" | "project";
  url?: string;
  /** The link the resource had before the model was changed. */
  video_link?: string;
  description?: string;
  tags?: string[];
  maxScore?: number;
  /** The score the resource had before the model was changed. */
  assigned_score?: number;
  deadline?: string | null;
  program: string;
  createdAt?: string;
}

interface TnCompletion {
  resource: string | { _id: string };
  score?: number;
  completedOn?: string;
  submittedOn?: string;
  githubLink?: string;
  deployedLink?: string;
  description?: string;
  verified?: boolean;
}

interface TnMentee {
  _id: string;
  name: string;
  email?: string;
  enrollmentNumber: string;
  bio?: string;
  interests?: string[];
  programs?: (string | { _id: string })[];
  completedResources?: TnCompletion[];
  totalScore?: number;
  streak?: number;
  lastActiveDate?: string;
  createdAt?: string;
}

/**
 * The id of a document that may be an id or the document itself.
 */
function idOf(value: string | { _id: string } | undefined): string {
  if (!value) return "";
  return typeof value === "string" ? value : value._id;
}

function toProgram(document: TnProgram): Program {
  const created = document.createdAt ?? new Date().toISOString();
  return {
    id: document._id,
    name: document.name,
    description: document.description ?? "",
    track: document.track ?? "general",
    status: document.status === "archived" ? "archived" : "active",
    createdAt: created,
    updatedAt: created,
  };
}

function toMentor(document: TnMentor): Mentor {
  return {
    id: document._id,
    name: document.name,
    email: document.email,
    title: document.title ?? "Mentor",
    bio: document.bio ?? "",
    skills: document.skills ?? [],
    programIds: (document.programs ?? []).map(idOf).filter(Boolean),
    createdAt: document.createdAt ?? new Date().toISOString(),
  };
}

function toMentee(document: TnMentee): Mentee {
  return {
    id: document._id,
    name: document.name,
    enrollmentNumber: document.enrollmentNumber,
    bio: document.bio ?? "",
    interests: document.interests ?? [],
    totalScore: document.totalScore ?? 0,
    streak: document.streak ?? 0,
    programIds: (document.programs ?? []).map(idOf).filter(Boolean),
    createdAt: document.createdAt ?? new Date().toISOString(),
    lastActiveAt: document.lastActiveDate ?? null,
  };
}

function toResource(document: TnResource): Resource {
  return {
    id: document._id,
    programId: idOf(document.program),
    // The resources that were made before the model was changed carry the
    // old field names, so both are read.
    title: document.title ?? document.heading ?? "Untitled resource",
    description: document.description ?? "",
    type: document.type ?? "video",
    url: document.url ?? document.video_link ?? "",
    maxScore: document.maxScore ?? document.assigned_score ?? 0,
    deadline: document.deadline ?? null,
    tags: document.tags ?? [],
    createdBy: "",
    createdAt: document.createdAt ?? new Date().toISOString(),
  };
}

function toProgress(
  menteeId: string,
  resourceId: string,
  completion: TnCompletion | undefined,
): Progress | null {
  if (!completion) return null;
  return {
    menteeId,
    resourceId,
    status: completion.verified ? "graded" : "submitted",
    score: completion.score ?? 0,
    startedAt: completion.completedOn ?? null,
    submittedAt: completion.submittedOn ?? completion.completedOn ?? null,
    gradedAt: completion.verified ? completion.completedOn ?? null : null,
    feedback: "",
  };
}

/**
 * The raw mentee document, which carries the progress the platform's own
 * shape does not keep.
 */
async function rawMentee(id: string): Promise<TnMentee | null> {
  try {
    return await tnCall<TnMentee>(`/api/m/mentee/${id}`, {
      token: await sessionToken(),
    });
  } catch {
    return null;
  }
}

/**
 * The raw mentees of a program.
 */
async function rawMenteesOfProgram(programId: string): Promise<TnMentee[]> {
  return tnCall<TnMentee[]>(`/api/${programId}/mentees`);
}

// --- programs ---------------------------------------------------------------

export async function listPrograms(): Promise<Program[]> {
  const documents = await tnCall<TnProgram[]>("/api/programs");
  return documents.map(toProgram);
}

export async function getProgram(id: string): Promise<Program | null> {
  const documents = await tnCall<TnProgram[]>("/api/programs");
  const found = documents.find((program) => program._id === id);
  return found ? toProgram(found) : null;
}

export async function createProgram(input: {
  name: string;
  description?: string;
  track?: string;
}): Promise<Program> {
  const document = await tnCall<TnProgram>("/api/programs", {
    method: "POST",
    body: {
      name: input.name,
      description: input.description ?? "",
      track: input.track ?? "general",
    },
  });
  return toProgram(document);
}

export async function updateProgram(
  id: string,
  patch: Partial<Pick<Program, "name" | "description" | "track" | "status">>,
): Promise<Program | null> {
  const document = await tnCall<TnProgram>(`/api/programs/${id}`, {
    method: "PATCH",
    body: patch,
  });
  return toProgram(document);
}

export async function deleteProgram(id: string): Promise<boolean> {
  await tnCall(`/api/programs/${id}`, { method: "DELETE", admin: true });
  return true;
}

// --- mentors ---------------------------------------------------------------

export async function listMentors(): Promise<Mentor[]> {
  const documents = await tnCall<TnMentor[]>("/api/mentors");
  return documents.map(toMentor);
}

export async function getMentor(id: string): Promise<Mentor | null> {
  const documents = await tnCall<TnMentor[]>("/api/mentors");
  const found = documents.find((mentor) => mentor._id === id);
  return found ? toMentor(found) : null;
}

export async function createMentor(input: {
  name: string;
  email: string;
  title?: string;
  bio?: string;
  skills?: string[];
  programIds?: string[];
  password?: string;
}): Promise<{ mentor: Mentor; password: string }> {
  const password = input.password ?? generatePassword();
  const document = await tnCall<TnMentor>("/api/mentors", {
    method: "POST",
    body: {
      name: input.name,
      email: input.email,
      password,
      title: input.title ?? "Mentor",
      bio: input.bio ?? "",
      skills: input.skills ?? [],
    },
  });

  for (const programId of input.programIds ?? []) {
    await assignMentorToProgram(programId, document._id);
  }

  return { mentor: toMentor(document), password };
}

export async function assignMentorToProgram(
  programId: string,
  mentorId: string,
): Promise<void> {
  await tnCall(`/api/programs/${programId}/add-mentor`, {
    method: "POST",
    body: { mentorId },
  });
}

export async function removeMentorFromProgram(
  programId: string,
  mentorId: string,
): Promise<void> {
  await tnCall(`/api/programs/${programId}/mentors/${mentorId}`, {
    method: "DELETE",
  });
}

export async function listMentorsForProgram(
  programId: string,
): Promise<Mentor[]> {
  const documents = await tnCall<TnProgram[]>("/api/programs");
  const program = documents.find((entry) => entry._id === programId);
  if (!program) return [];

  return (program.mentors ?? [])
    .map((mentor) => (typeof mentor === "string" ? null : toMentor(mentor)))
    .filter((mentor): mentor is Mentor => mentor !== null);
}

export async function deleteMentor(id: string): Promise<boolean> {
  await tnCall(`/api/mentors/${id}`, { method: "DELETE", admin: true });
  return true;
}

// --- mentees ---------------------------------------------------------------

export async function listMentees(): Promise<Mentee[]> {
  const programs = await listPrograms();
  const seen = new Map<string, Mentee>();

  for (const program of programs) {
    const documents = await rawMenteesOfProgram(program.id);
    for (const document of documents) {
      if (!seen.has(document._id)) seen.set(document._id, toMentee(document));
    }
  }

  return [...seen.values()];
}

export async function getMentee(id: string): Promise<Mentee | null> {
  const document = await rawMentee(id);
  return document ? toMentee(document) : null;
}

export async function listMenteesForProgram(
  programId: string,
): Promise<Mentee[]> {
  const documents = await rawMenteesOfProgram(programId);
  return documents.map(toMentee);
}

export async function createMentee(input: {
  name: string;
  email?: string;
  enrollmentNumber?: string;
  bio?: string;
  interests?: string[];
  programIds?: string[];
  password?: string;
}): Promise<{ mentee: Mentee; enrollmentNumber: string; password: string }> {
  const token = await sessionToken();
  const programId = input.programIds?.[0];
  if (!programId) {
    throw new Error("A mentee has to be added to a program");
  }

  const enrollmentNumber =
    input.enrollmentNumber?.trim().toUpperCase() || generateEnrollmentNumber();

  const result = await tnCall<{
    mentee: TnMentee;
    tempPassword: string;
  }>("/api/mentees", {
    method: "POST",
    token,
    body: {
      name: input.name,
      email: input.email ?? `${enrollmentNumber.toLowerCase()}@example.com`,
      enrollmentNumber,
      programId,
      interests: input.interests ?? [],
    },
  });

  return {
    mentee: toMentee(result.mentee),
    enrollmentNumber: result.mentee.enrollmentNumber,
    password: result.tempPassword,
  };
}

export async function assignMenteeToProgram(
  programId: string,
  menteeId: string,
): Promise<void> {
  // The tn backend adds a mentee to a program when they are created, so
  // there is nothing to call here.
  void programId;
  void menteeId;
}

export async function removeMenteeFromProgram(
  programId: string,
  menteeId: string,
): Promise<void> {
  void programId;
  void menteeId;
}

// --- resources -------------------------------------------------------------

export async function listResources(programId: string): Promise<Resource[]> {
  const documents = await tnCall<TnResource[]>(`/api/${programId}/resources`);
  return documents.map(toResource);
}

export async function getResource(id: string): Promise<Resource | null> {
  const document = await tnCall<TnResource>(`/api/resources/${id}`);
  return toResource(document);
}

export async function createResource(input: {
  programId: string;
  title: string;
  description?: string;
  type: Resource["type"];
  url?: string;
  maxScore?: number;
  deadline?: string | null;
  tags?: string[];
  createdBy?: string;
}): Promise<Resource> {
  const token = await sessionToken();
  const document = await tnCall<TnResource>("/api/resources", {
    method: "POST",
    token,
    body: {
      program: input.programId,
      title: input.title,
      type: input.type,
      url: input.url ?? "",
      description: input.description ?? "",
      tags: input.tags ?? [],
      maxScore: input.maxScore ?? 0,
      deadline: input.deadline ?? undefined,
    },
  });
  return toResource(document);
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
  const token = await sessionToken();
  const document = await tnCall<TnResource>(`/api/resources/${id}`, {
    method: "PATCH",
    token,
    body: patch,
  });
  return toResource(document);
}

export async function deleteResource(id: string): Promise<boolean> {
  await tnCall(`/api/resources/${id}`, { method: "DELETE", admin: true });
  return true;
}

// --- progress --------------------------------------------------------------

export async function getProgress(
  menteeId: string,
  resourceId: string,
): Promise<Progress | null> {
  const mentee = await rawMentee(menteeId);
  const completion = mentee?.completedResources?.find(
    (entry) => idOf(entry.resource) === resourceId,
  );
  return toProgress(menteeId, resourceId, completion);
}

export async function listMenteeResources(
  menteeId: string,
): Promise<ResourceWithProgress[]> {
  const dashboard = await tnCall<{
    programs: { _id: string; resources: TnResource[] }[];
  }>("/api/m/dashboard", { token: await sessionToken() });

  const mentee = await rawMentee(menteeId);
  const now = Date.now();

  const resources: ResourceWithProgress[] = [];
  for (const program of dashboard.programs ?? []) {
    for (const document of program.resources ?? []) {
      const resource = toResource(document);
      const completion = mentee?.completedResources?.find(
        (entry) => idOf(entry.resource) === resource.id,
      );
      const progress = toProgress(menteeId, resource.id, completion);

      resources.push({
        ...resource,
        progress,
        submission: completion
          ? {
              id: `${menteeId}-${resource.id}`,
              menteeId,
              resourceId: resource.id,
              body: completion.githubLink ?? completion.description ?? "",
              submittedAt: completion.submittedOn ?? "",
            }
          : null,
        overdue:
          resource.deadline !== null &&
          resource.deadline !== undefined &&
          new Date(resource.deadline).getTime() < now &&
          progress?.status !== "graded",
      });
    }
  }

  return resources;
}

export async function listMentorResourceProgress(
  mentorId: string,
  programId: string,
): Promise<{
  resource: Resource;
  entries: { mentee: Mentee; progress: Progress | null }[];
}[]> {
  const resources = await listResources(programId);
  const mentees = await listMenteesForProgram(programId);
  void mentorId;

  const result = [];
  for (const resource of resources) {
    const entries = [];
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
  const mentee = await rawMentee(menteeId);
  const completion = mentee?.completedResources?.find(
    (entry) => idOf(entry.resource) === resourceId,
  );
  if (!completion) return null;
  return {
    id: `${menteeId}-${resourceId}`,
    menteeId,
    resourceId,
    body: completion.githubLink ?? completion.description ?? "",
    submittedAt: completion.submittedOn ?? "",
  };
}

export async function startResource(
  menteeId: string,
  resourceId: string,
): Promise<void> {
  // The tn backend records a resource as complete in one step, so starting
  // and finishing are the same call.
  void menteeId;
  void resourceId;
}

export async function submitResource(
  menteeId: string,
  resourceId: string,
  body: string,
): Promise<void> {
  const token = await sessionToken();
  const resource = await getResource(resourceId);

  if (resource?.type === "project") {
    await tnCall(`/api/m/resources/${resourceId}/project`, {
      method: "POST",
      token,
      body: {
        githubLink: body,
        deployedLink: body,
        description: body,
      },
    });
    return;
  }

  await tnCall(`/api/m/resources/${resourceId}/complete`, {
    method: "POST",
    token,
  });
}

export async function gradeResource(input: {
  menteeId: string;
  resourceId: string;
  score: number;
  feedback?: string;
  reason?: string;
}): Promise<void> {
  const token = await sessionToken();
  await tnCall(`/api/${input.menteeId}/resources/${input.resourceId}/verify`, {
    method: "PATCH",
    token,
    body: { score: input.score },
  });
}

// --- scores ----------------------------------------------------------------

export async function scoreEventsFor(menteeId: string): Promise<ScoreEvent[]> {
  const mentee = await rawMentee(menteeId);
  if (!mentee) return [];

  return (mentee.completedResources ?? []).map((completion) => ({
    id: `${menteeId}-${idOf(completion.resource)}`,
    menteeId,
    resourceId: idOf(completion.resource),
    delta: completion.score ?? 0,
    reason: "Marked",
    createdAt: completion.completedOn ?? new Date().toISOString(),
  }));
}

export async function leaderboard(limit = 50): Promise<LeaderboardRow[]> {
  const rows = await tnCall<
    { rank: number; name: string; totalScore: number; streak: number }[]
  >("/api/m/leaderboard?limit=" + limit);

  // The tn backend does not send an id with each row, so the name stands
  // in for one. It is what the leaderboard shows anyway.
  return rows.map((row) => ({ ...row, id: row.name }));
}

// --- the platform itself ----------------------------------------------------

export async function counts(): Promise<{
  programs: number;
  mentors: number;
  mentees: number;
  resources: number;
}> {
  const programs = await tnCall<TnProgram[]>("/api/programs");
  const mentors = await tnCall<TnMentor[]>("/api/mentors");

  // The mentees are not listed as one collection, so they are counted a
  // program at a time. The requests go out together.
  const perProgram = await Promise.all(
    programs.map((program) =>
      tnCall<TnMentee[]>(`/api/${program._id}/mentees`).catch(() => []),
    ),
  );

  const seen = new Set<string>();
  let resources = 0;
  for (const document of programs) {
    resources += (document.resources ?? []).length;
    for (const mentee of perProgram[programs.indexOf(document)] ?? []) {
      seen.add(mentee._id);
    }
  }

  return {
    programs: programs.length,
    mentors: mentors.length,
    mentees: seen.size,
    resources,
  };
}

export async function programCount(): Promise<number> {
  const programs = await listPrograms();
  return programs.length;
}

export async function resetPlatform(): Promise<void> {
  const programs = await listPrograms();
  for (const program of programs) {
    await tnCall(`/api/programs/${program.id}`, {
      method: "DELETE",
      admin: true,
    });
  }
}

export { BASE as TN_BACKEND_URL };
