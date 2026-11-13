import type { ResourceType } from "../types";
import type { ProfileInput } from "./profile";

/**
 * The numbers behind the charts on the profile.
 *
 * These are the same facts the profile engine reads, arranged for
 * drawing rather than for writing sentences about. Kept apart from the
 * engine so the words and the pictures can change on their own.
 */
export interface ProfileCharts {
  /** For each kind of work, how much is done out of how much was set. */
  byType: { type: ResourceType; label: string; done: number; total: number }[];
  /** The running total of points, one point per mark given. */
  scoreOverTime: { at: string; total: number }[];
  /** Where each piece of work stands, in order from finished to untouched. */
  status: { key: string; label: string; count: number }[];
  /** For a mentor: each mentee's points, highest first. */
  mentees: { id: string; name: string; score: number }[];
}

const TYPE_LABEL: Record<ResourceType, string> = {
  video: "Videos",
  quiz: "Quizzes",
  project: "Projects",
};

const TYPES: ResourceType[] = ["video", "quiz", "project"];

export function buildProfileCharts(input: ProfileInput): ProfileCharts {
  const byType = TYPES.map((type) => {
    const ofType = input.resources.filter((r) => r.type === type);
    return {
      type,
      label: TYPE_LABEL[type],
      // A mentor's resources are not "done"; what they have is how many
      // they have published, which the total already says.
      done:
        input.role === "mentor"
          ? ofType.length
          : ofType.filter((r) => r.status === "graded").length,
      total: ofType.length,
    };
  });

  let running = 0;
  const scoreOverTime = [...input.scoreHistory]
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    .map((entry) => {
      running += entry.delta;
      return { at: entry.at, total: running };
    });

  const count = (status: string) =>
    input.resources.filter((r) => r.status === status).length;

  const status = [
    { key: "graded", label: "Marked", count: count("graded") },
    { key: "submitted", label: "Handed in", count: count("submitted") },
    { key: "in_progress", label: "In progress", count: count("in_progress") },
    { key: "assigned", label: "Not started", count: count("assigned") },
  ];

  const mentees = [...(input.mentees ?? [])]
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((mentee) => ({
      id: mentee.id,
      name: mentee.name,
      score: mentee.totalScore,
    }));

  return { byType, scoreOverTime, status, mentees };
}
