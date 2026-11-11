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
} from "./types";

/**
 * What the platform can do, whoever is holding the data.
 *
 * There are two of these. One keeps everything in this project's own
 * SQLite database, and one talks to the Express and MongoDB backend that
 * came with the platform. The panels do not know which one they are
 * talking to.
 */
export interface PlatformStore {
  // --- programs ---
  listPrograms(): Promise<Program[]>;
  getProgram(id: string): Promise<Program | null>;
  createProgram(input: {
    name: string;
    description?: string;
    track?: string;
  }): Promise<Program>;
  updateProgram(
    id: string,
    patch: Partial<
      Pick<Program, "name" | "description" | "track" | "status">
    >,
  ): Promise<Program | null>;
  deleteProgram(id: string): Promise<boolean>;

  // --- mentors ---
  listMentors(): Promise<Mentor[]>;
  getMentor(id: string): Promise<Mentor | null>;
  createMentor(input: {
    name: string;
    email: string;
    title?: string;
    bio?: string;
    skills?: string[];
    programIds?: string[];
    /** The password to set. One is generated when this is left out. */
    password?: string;
  }): Promise<{ mentor: Mentor; password: string }>;
  assignMentorToProgram(
    programId: string,
    mentorId: string,
  ): Promise<void>;
  removeMentorFromProgram(
    programId: string,
    mentorId: string,
  ): Promise<void>;
  listMentorsForProgram(programId: string): Promise<Mentor[]>;
  deleteMentor(id: string): Promise<boolean>;

  // --- mentees ---
  listMentees(): Promise<Mentee[]>;
  getMentee(id: string): Promise<Mentee | null>;
  listMenteesForProgram(programId: string): Promise<Mentee[]>;
  createMentee(input: {
    name: string;
    email?: string;
    enrollmentNumber?: string;
    bio?: string;
    interests?: string[];
    programIds?: string[];
    /** The password to set. One is generated when this is left out. */
    password?: string;
  }): Promise<{ mentee: Mentee; enrollmentNumber: string; password: string }>;
  assignMenteeToProgram(
    programId: string,
    menteeId: string,
  ): Promise<void>;
  removeMenteeFromProgram(
    programId: string,
    menteeId: string,
  ): Promise<void>;

  // --- resources ---
  listResources(programId: string): Promise<Resource[]>;
  getResource(id: string): Promise<Resource | null>;
  createResource(input: {
    programId: string;
    title: string;
    description?: string;
    type: Resource["type"];
    url?: string;
    maxScore?: number;
    deadline?: string | null;
    tags?: string[];
    createdBy?: string;
  }): Promise<Resource>;
  updateResource(
    id: string,
    patch: Partial<
      Pick<
        Resource,
        "title" | "description" | "type" | "url" | "maxScore" | "deadline" | "tags"
      >
    >,
  ): Promise<Resource | null>;
  deleteResource(id: string): Promise<boolean>;

  // --- progress ---
  getProgress(
    menteeId: string,
    resourceId: string,
  ): Promise<Progress | null>;
  listMenteeResources(menteeId: string): Promise<ResourceWithProgress[]>;
  listMentorResourceProgress(
    mentorId: string,
    programId: string,
  ): Promise<{
    resource: Resource;
    entries: { mentee: Mentee; progress: Progress | null }[];
  }[]>;
  getSubmission(
    menteeId: string,
    resourceId: string,
  ): Promise<Submission | null>;
  startResource(menteeId: string, resourceId: string): Promise<void>;
  submitResource(
    menteeId: string,
    resourceId: string,
    body: string,
  ): Promise<void>;
  gradeResource(input: {
    menteeId: string;
    resourceId: string;
    score: number;
    feedback?: string;
    reason?: string;
  }): Promise<void>;

  // --- scores ---
  scoreEventsFor(menteeId: string): Promise<ScoreEvent[]>;
  leaderboard(limit?: number): Promise<LeaderboardRow[]>;

  // --- the platform itself ---
  programCount(): Promise<number>;
  resetPlatform(): Promise<void>;
  /**
   * How much is on the platform.
   *
   * The admin panel shows these, and in tn mode they cannot be counted in
   * this project's own database, because the data is not there.
   */
  counts(): Promise<{
    programs: number;
    mentors: number;
    mentees: number;
    resources: number;
  }>;
}

/**
 * The result of a sign-in attempt.
 */
export interface StoreCredentials {
  /** The identifier the person signed in with. */
  identifier: string;
  /** The token to send with every later request. */
  token: string;
}
