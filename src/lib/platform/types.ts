/**
 * The domain model for the mentorship platform.
 *
 * Three roles, each with its own panel:
 *
 *  - admin   creates programs and onboards mentors
 *  - mentor  adds mentees to their programs, publishes resources, grades work
 *  - mentee  works through the resources assigned to them
 *
 * The shapes here are the ones the panels and the API speak, so a route
 * handler and a server component can share the same types.
 */

export type Role = "admin" | "mentor" | "mentee";

/**
 * The three kinds of learning resource a mentor can publish.
 */
export type ResourceType = "video" | "quiz" | "project";

/**
 * Where a mentee is with a given resource.
 */
export type ProgressStatus =
  | "assigned"
  | "in_progress"
  | "submitted"
  | "graded";

export interface Program {
  id: string;
  name: string;
  description: string;
  /**
   * The subject area, used to group programs and to match a mentee's
   * interests against the work they have done.
   */
  track: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface Mentor {
  id: string;
  name: string;
  email: string;
  title: string;
  bio: string;
  /** Interest tags, matched against mentee interests for recommendations. */
  skills: string[];
  programIds: string[];
  createdAt: string;
}

export interface Mentee {
  id: string;
  name: string;
  /** The credential a mentee signs in with. */
  enrollmentNumber: string;
  bio: string;
  /** Interest tags, used to recommend resources. */
  interests: string[];
  totalScore: number;
  streak: number;
  programIds: string[];
  createdAt: string;
  lastActiveAt: string | null;
}

export interface Resource {
  id: string;
  programId: string;
  title: string;
  description: string;
  type: ResourceType;
  /** Where the work lives: a video link, a quiz, or a project brief. */
  url: string;
  /** The most a mentee can score on this resource. */
  maxScore: number;
  /** ISO timestamp. Null means no deadline. */
  deadline: string | null;
  tags: string[];
  createdBy: string;
  createdAt: string;
}

export interface Progress {
  menteeId: string;
  resourceId: string;
  status: ProgressStatus;
  score: number;
  startedAt: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  feedback: string;
}

export interface Submission {
  id: string;
  menteeId: string;
  resourceId: string;
  /** A link for a project, an answer set for a quiz. */
  body: string;
  submittedAt: string;
}

export interface ScoreEvent {
  id: string;
  menteeId: string;
  resourceId: string | null;
  delta: number;
  reason: string;
  createdAt: string;
}

export interface LeaderboardRow {
  rank: number;
  id: string;
  name: string;
  totalScore: number;
  streak: number;
}

/**
 * Who is signed in, as the panels see them.
 */
export interface SessionUser {
  role: Role;
  id: string;
  name: string;
  /**
   * The credential the user signs in with: an enrollment number for a
   * mentee, an email for a mentor and an admin.
   */
  identifier: string;
  /** The programs the user is attached to. */
  programIds: string[];
}

/**
 * A resource together with the mentee's own progress on it.
 */
export interface ResourceWithProgress extends Resource {
  progress: Progress | null;
  submission: Submission | null;
}
