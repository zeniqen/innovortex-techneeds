import type { ResourceType } from "../types";

/**
 * The profile engine.
 *
 * This is what section 5 of the brief calls the AI generated profile. It
 * reads what a person has actually done - what they have finished, what
 * they scored, where they are on the leaderboard, what they said they
 * were interested in - and works out what that means.
 *
 * It is a set of rules rather than a language model. That is a deliberate
 * choice: the same person always gets the same profile, it costs nothing
 * to serve, it needs no key, and every claim on the profile can be traced
 * back to a number on the platform. An LLM can be put in front of it
 * later - the shape of the output is the same either way.
 */

/**
 * One piece of work, as the engine sees it.
 */
export interface ProfileResource {
  id: string;
  title: string;
  type: ResourceType;
  tags: string[];
  programId: string;
  programName: string;
  maxScore: number;
  deadline: string | null;
  status: "assigned" | "in_progress" | "submitted" | "graded";
  score: number;
  overdue: boolean;
}

/**
 * One mentee, as a mentor's profile sees them.
 */
export interface ProfileMentee {
  id: string;
  name: string;
  totalScore: number;
  completed: number;
  assigned: number;
  overdue: number;
}

export interface ProfileInput {
  role: "mentee" | "mentor";
  id: string;
  name: string;
  interests: string[];
  totalScore: number;
  streak: number;
  programs: { id: string; name: string; track: string }[];
  resources: ProfileResource[];
  /** Where they are on the leaderboard. Null when they are not on it. */
  rank: number | null;
  /** How many people are on the leaderboard. */
  fieldSize: number;
  /** The score events, with the time each one was given. */
  scoreHistory: { resourceId: string | null; at: string; delta: number }[];
  /** Only for a mentor. */
  mentees?: ProfileMentee[];
}

export interface ProfileBadge {
  id: string;
  label: string;
  description: string;
  tone: "neutral" | "good" | "warn";
}

export interface ProfileHighlight {
  label: string;
  value: string;
  detail?: string;
}

export interface ProfileRecommendation {
  resourceId: string;
  title: string;
  kind: string;
  reason: string;
  due?: string;
}

export interface AiProfile {
  /** The crest seed, so the picture is the same every time. */
  avatarSeed: string;
  /** The archetype the engine settled on. */
  archetype: { name: string; description: string };
  /** One line, for the top of the profile. */
  headline: string;
  /** A paragraph, built from the numbers. */
  summary: string;
  badges: ProfileBadge[];
  highlights: ProfileHighlight[];
  recommendations: ProfileRecommendation[];
  /** How far along they are, and how far to the next step. */
  level: {
    number: number;
    title: string;
    completed: number;
    needed: number;
    fraction: number;
  };
}

/**
 * The words for each kind of work.
 */
const KIND_LABEL: Record<ResourceType, string> = {
  video: "watching",
  quiz: "quizzes",
  project: "building",
};

/**
 * The level titles, in order.
 */
const LEVEL_TITLES = [
  "Just started",
  "Getting going",
  "Building momentum",
  "On a roll",
  "Sharp",
  "Ahead of the curve",
  "Setting the pace",
];

/**
 * How many pieces of work each level is worth.
 */
const LEVEL_STEP = 3;

/**
 * Turns a list into a sentence with "and" at the end.
 */
function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * Works out the profile.
 */
export function buildProfile(input: ProfileInput, now: number): AiProfile {
  return input.role === "mentor"
    ? buildMentorProfile(input)
    : buildMenteeProfile(input, now);
}

/**
 * The profile of a mentee.
 */
function buildMenteeProfile(input: ProfileInput, now: number): AiProfile {
  const graded = input.resources.filter((r) => r.status === "graded");
  const completed = graded.filter((r) => r.score > 0 || r.maxScore === 0);
  const open = input.resources.filter((r) => r.status !== "graded");
  const overdue = open.filter((r) => r.overdue);

  const byType: Record<ResourceType, number> = { video: 0, quiz: 0, project: 0 };
  for (const resource of completed) byType[resource.type]++;

  const strongest = (Object.keys(byType) as ResourceType[]).sort(
    (a, b) => byType[b] - byType[a],
  )[0];

  const pointsEarned = graded.reduce((sum, r) => sum + r.score, 0);
  const pointsPossible = graded.reduce((sum, r) => sum + r.maxScore, 0);
  const average =
    pointsPossible > 0 ? Math.round((pointsEarned / pointsPossible) * 100) : 0;

  // A piece of work counts as handed in on time when the mark for it was
  // given before the deadline it was set.
  const onTime = completed.filter((resource) => {
    if (!resource.deadline) return false;
    const event = input.scoreHistory.find(
      (entry) => entry.resourceId === resource.id,
    );
    if (!event) return false;
    return (
      new Date(event.at).getTime() <= new Date(resource.deadline).getTime()
    );
  }).length;

  const badges = menteeBadges({
    input,
    completed,
    marked: graded.length,
    overdue,
    average,
    onTime,
  });

  const archetype = menteeArchetype({
    completed: completed.length,
    byType,
    streak: input.streak,
    rank: input.rank,
  });

  const rankText =
    input.rank === null
      ? "you are not on the leaderboard yet"
      : input.rank === 1
        ? "you are top of the leaderboard"
        : input.rank <= 3
          ? `you are ${ordinal(input.rank)} on the leaderboard`
          : `you are ${ordinal(input.rank)} on the leaderboard`;

  const programText =
    input.programs.length > 0
      ? ` You are working through ${joinList(input.programs.map((p) => p.name))}.`
      : "";

  const summary =
    completed.length === 0
      ? `You have ${input.totalScore} points and ${input.resources.length} ${
          input.resources.length === 1 ? "piece" : "pieces"
        } of work waiting. ${rankText[0].toUpperCase()}${rankText.slice(1)}.${programText}`
      : `You have ${input.totalScore} points from ${completed.length} marked ${
          completed.length === 1 ? "piece" : "pieces"
        } of work, averaging ${average}%, and ${rankText[0].toUpperCase()}${rankText.slice(1)}. You are strongest in ${KIND_LABEL[strongest]}, and your best work is in ${
          mostCommonTag(completed) ??
          mostCommonProgram(completed) ??
          "the topics you have started"
        }.${programText}`;

  const headline =
    completed.length === 0
      ? "Ready for the first one"
      : `${input.totalScore} points and ${input.streak} day${
          input.streak === 1 ? "" : "s"
        } in a row`;

  const highlights: ProfileHighlight[] = [
    {
      label: "Points",
      value: String(input.totalScore),
      detail:
        graded.length > 0 ? `from ${graded.length} marked pieces` : "nothing marked yet",
    },
    {
      label: "Completion",
      value: `${completed.length}/${input.resources.length}`,
      detail: "pieces of work finished",
    },
    {
      label: "Average mark",
      value: graded.length > 0 ? `${average}%` : "—",
      detail: graded.length > 0 ? "across everything marked" : "no marks yet",
    },
    {
      label: "Streak",
      value: `${input.streak}`,
      detail: input.streak === 1 ? "day" : "days",
    },
  ];

  if (input.rank !== null) {
    highlights.push({
      label: "Rank",
      value: `#${input.rank}`,
      detail: `of ${input.fieldSize} on the leaderboard`,
    });
  }

  const levelNumber = Math.floor(completed.length / LEVEL_STEP);
  const levelStart = levelNumber * LEVEL_STEP;
  const level = {
    number: levelNumber + 1,
    title: LEVEL_TITLES[Math.min(levelNumber, LEVEL_TITLES.length - 1)],
    completed: completed.length - levelStart,
    needed: LEVEL_STEP,
    fraction: (completed.length - levelStart) / LEVEL_STEP,
  };

  return {
    avatarSeed: `${input.id}:${input.name}`,
    archetype,
    headline,
    summary,
    badges,
    highlights,
    recommendations: recommend(input, now),
    level,
  };
}

/**
 * The badges a mentee has earned.
 */
function menteeBadges(args: {
  input: ProfileInput;
  completed: ProfileResource[];
  marked: number;
  overdue: ProfileResource[];
  average: number;
  onTime: number;
}): ProfileBadge[] {
  const { input, completed, marked, overdue, average, onTime } = args;
  const badges: ProfileBadge[] = [];

  if (completed.length >= 1) {
    badges.push({
      id: "first-steps",
      label: "First steps",
      description: "Finished the first piece of work.",
      tone: "good",
    });
  }
  if (completed.length >= 5) {
    badges.push({
      id: "quick-study",
      label: "Quick study",
      description: "Finished five pieces of work.",
      tone: "good",
    });
  }
  if (completed.length >= 10) {
    badges.push({
      id: "deep-diver",
      label: "Deep diver",
      description: "Finished ten pieces of work.",
      tone: "good",
    });
  }

  const byType: Record<ResourceType, number> = { video: 0, quiz: 0, project: 0 };
  for (const resource of completed) byType[resource.type]++;

  if (byType.quiz >= 3) {
    badges.push({
      id: "quiz-whiz",
      label: "Quiz whiz",
      description: `Passed ${byType.quiz} quizzes.`,
      tone: "good",
    });
  }
  if (byType.project >= 2) {
    badges.push({
      id: "builder",
      label: "Builder",
      description: `Shipped ${byType.project} projects.`,
      tone: "good",
    });
  }
  if (byType.video >= 3) {
    badges.push({
      id: "video-scholar",
      label: "Video scholar",
      description: `Watched ${byType.video} modules.`,
      tone: "good",
    });
  }

  if (input.streak >= 3) {
    badges.push({
      id: "streak-keeper",
      label: "Streak keeper",
      description: `${input.streak} days in a row.`,
      tone: "good",
    });
  }

  if (input.rank !== null && input.rank <= 3) {
    badges.push({
      id: "podium",
      label: "On the podium",
      description: `Ranked ${ordinal(input.rank)} on the leaderboard.`,
      tone: "good",
    });
  } else if (input.rank !== null && input.rank <= 10) {
    badges.push({
      id: "top-ten",
      label: "Top ten",
      description: `Ranked ${ordinal(input.rank)} on the leaderboard.`,
      tone: "good",
    });
  }

  if (input.totalScore >= 100) {
    badges.push({
      id: "century",
      label: "Century",
      description: "A hundred points and counting.",
      tone: "good",
    });
  }

  if (marked >= 3 && average >= 95) {
    badges.push({
      id: "perfectionist",
      label: "Perfectionist",
      description: `Averaging ${average}% across everything marked.`,
      tone: "good",
    });
  }

  if (onTime >= 3) {
    badges.push({
      id: "on-time",
      label: "Right on time",
      description: "Handed in three pieces of work before the deadline.",
      tone: "good",
    });
  }

  if (overdue.length > 0) {
    badges.push({
      id: "overdue",
      label: `${overdue.length} overdue`,
      description: "There is work past its deadline.",
      tone: "warn",
    });
  }

  // A badge for every subject they have actually done two or more of.
  const tagCounts = new Map<string, number>();
  for (const resource of completed) {
    for (const tag of resource.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  for (const [tag, count] of [...tagCounts.entries()]
    .filter(([, value]) => value >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)) {
    badges.push({
      id: `tag-${tag}`,
      label: tag,
      description: `Done ${count} pieces of work on ${tag}.`,
      tone: "neutral",
    });
  }

  return badges;
}

/**
 * The archetype for a mentee, from what they have finished.
 */
function menteeArchetype(args: {
  completed: number;
  byType: Record<ResourceType, number>;
  streak: number;
  rank: number | null;
}): AiProfile["archetype"] {
  const { completed, byType, streak, rank } = args;

  if (completed === 0) {
    return {
      name: "The Starter",
      description:
        "Every track starts with the same first piece of work. This is yours.",
    };
  }

  if (rank !== null && rank <= 3 && streak >= 3) {
    return {
      name: "The Trailblazer",
      description:
        "A long streak and a place at the top of the board. People are following this one.",
    };
  }

  if (byType.project >= byType.quiz && byType.project >= byType.video) {
    return {
      name: "The Builder",
      description:
        "This one learns by making things. The projects are where the marks are.",
    };
  }
  if (byType.quiz >= byType.video) {
    return {
      name: "The Analyst",
      description:
        "Sharp with the fundamentals. The quizzes are where the marks are.",
    };
  }
  return {
    name: "The Explorer",
    description:
      "Broad and curious, and quickest to pick up something new. The modules are where the marks are.",
  };
}

/**
 * The most common tag on what they have finished.
 */
function mostCommonTag(completed: ProfileResource[]): string | null {
  const counts = new Map<string, number>();
  for (const resource of completed) {
    for (const tag of resource.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [tag, count] of counts) {
    if (count > bestCount) {
      best = tag;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The program most of their finished work is on.
 */
function mostCommonProgram(completed: ProfileResource[]): string | null {
  const counts = new Map<string, number>();
  for (const resource of completed) {
    if (!resource.programName) continue;
    counts.set(
      resource.programName,
      (counts.get(resource.programName) ?? 0) + 1,
    );
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [name, count] of counts) {
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/**
 * What to work on next.
 *
 * A resource is scored on how close it is to what they said they were
 * interested in, how close it is to what they have already done, and
 * whether it is in a program they are on. The reason is written out so
 * the suggestion can be argued with.
 */
function recommend(input: ProfileInput, now: number): ProfileRecommendation[] {
  const done = new Set(
    input.resources.filter((r) => r.status === "graded").map((r) => r.id),
  );
  const open = input.resources.filter((r) => !done.has(r.id));

  const interestTags = new Set(input.interests.map((tag) => tag.toLowerCase()));

  // The tags of what they have already done, so the next thing can sit
  // next to it.
  const doneTags = new Set<string>();
  for (const resource of input.resources) {
    if (!done.has(resource.id)) continue;
    for (const tag of resource.tags) doneTags.add(tag.toLowerCase());
  }

  const scored = open
    .map((resource) => {
      let score = 0;
      const reasons: string[] = [];

      const matching = resource.tags.filter((tag) =>
        interestTags.has(tag.toLowerCase()),
      );
      if (matching.length > 0) {
        score += matching.length * 3;
        reasons.push(`you said you were interested in ${matching[0]}`);
      }

      const adjacent = resource.tags.filter((tag) =>
        doneTags.has(tag.toLowerCase()),
      );
      if (adjacent.length > 0) {
        score += adjacent.length * 2;
        reasons.push(`it builds on ${adjacent[0]}, which you have already done`);
      }

      if (input.programs.some((program) => program.id === resource.programId)) {
        score += 1;
        reasons.push("it is on your program");
      }

      if (resource.overdue) {
        score += 4;
        reasons.push("it is already overdue");
      }

      const daysLeft = resource.deadline
        ? Math.ceil((new Date(resource.deadline).getTime() - now) / 86400000)
        : null;

      return { resource, score, reasons, daysLeft };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // The soonest deadline wins a tie.
      const aDays = a.daysLeft ?? Number.MAX_SAFE_INTEGER;
      const bDays = b.daysLeft ?? Number.MAX_SAFE_INTEGER;
      return aDays - bDays;
    })
    .slice(0, 4);

  return scored.map((entry) => {
    const reasons = [...entry.reasons];

    if (entry.daysLeft !== null) {
      if (entry.daysLeft < 0) {
        reasons.push(`it was due ${Math.abs(entry.daysLeft)} days ago`);
      } else if (entry.daysLeft === 0) {
        reasons.push("it is due today");
      } else if (entry.daysLeft <= 7) {
        reasons.push(`it is due in ${entry.daysLeft} days`);
      }
    }

    return {
      resourceId: entry.resource.id,
      title: entry.resource.title,
      kind:
        entry.resource.type === "quiz"
          ? "Quiz"
          : entry.resource.type === "project"
            ? "Project"
            : "Video",
      reason: `Because ${reasons.slice(0, 3).join(", and ")}.`,
      due: entry.resource.deadline ?? undefined,
    };
  });
}

/**
 * The profile of a mentor.
 */
function buildMentorProfile(input: ProfileInput): AiProfile {
  const mentees = input.mentees ?? [];
  const totalAssigned = mentees.reduce((sum, m) => sum + m.assigned, 0);
  const totalCompleted = mentees.reduce((sum, m) => sum + m.completed, 0);
  const totalOverdue = mentees.reduce((sum, m) => sum + m.overdue, 0);
  const averageScore =
    mentees.length > 0
      ? Math.round(
          mentees.reduce((sum, m) => sum + m.totalScore, 0) / mentees.length,
        )
      : 0;
  const completionRate =
    totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

  const waitingToMark = input.resources.filter((r) => r.status === "submitted");

  const badges: ProfileBadge[] = [];

  if (mentees.length >= 1) {
    badges.push({
      id: "first-mentee",
      label: "First mentee",
      description: "Looked after somebody's first program.",
      tone: "good",
    });
  }
  if (mentees.length >= 5) {
    badges.push({
      id: "mentor-of-five",
      label: "Mentor of five",
      description: `Looked after ${mentees.length} mentees.`,
      tone: "good",
    });
  }
  if (input.programs.length >= 2) {
    badges.push({
      id: "program-builder",
      label: "Program builder",
      description: `Runs ${input.programs.length} programs at once.`,
      tone: "good",
    });
  }
  if (completionRate >= 60 && totalCompleted > 0) {
    badges.push({
      id: "mover",
      label: "Mover",
      description: `${completionRate}% of the work you set has been finished.`,
      tone: "good",
    });
  }
  if (averageScore >= 60 && mentees.length > 0) {
    badges.push({
      id: "high-flyers",
      label: "High flyers",
      description: `Your mentees average ${averageScore} points.`,
      tone: "good",
    });
  }
  if (totalOverdue > 0) {
    badges.push({
      id: "chasing",
      label: `${totalOverdue} overdue`,
      description: "Some of your mentees have work past its deadline.",
      tone: "warn",
    });
  }

  const archetype =
    mentees.length === 0
      ? {
          name: "The Mentor in waiting",
          description:
            "Not looking after anybody yet. The first mentee changes everything here.",
        }
      : completionRate >= 60
        ? {
            name: "The Catalyst",
            description:
              "Mentees here get through what they are set. The work keeps moving.",
          }
        : completionRate >= 30
          ? {
              name: "The Anchor",
              description:
                "Steady and reliable. The people here get the same attention every week.",
            }
          : {
              name: "The Gardener",
              description:
                "Patient work. The numbers are still coming through, and the people are still here.",
            };

  const summary =
    mentees.length === 0
      ? "You are not looking after anybody yet. Once you are put on a program, your mentees and their progress show up here."
      : `You are looking after ${mentees.length} ${mentees.length === 1 ? "person" : "people"} across ${input.programs.length} ${input.programs.length === 1 ? "program" : "programs"}. ${completionRate}% of the work you have set has been finished, and your mentees average ${averageScore} points.${
          waitingToMark.length > 0
            ? ` ${waitingToMark.length} ${waitingToMark.length === 1 ? "piece" : "pieces"} of work ${waitingToMark.length === 1 ? "is" : "are"} waiting for a mark.`
            : ""
        }`;

  const highlights: ProfileHighlight[] = [
    {
      label: "Mentees",
      value: String(mentees.length),
      detail: `across ${input.programs.length} programs`,
    },
    {
      label: "Work set",
      value: String(input.resources.length),
      detail: `${totalCompleted} finished`,
    },
    {
      label: "Completion",
      value: `${completionRate}%`,
      detail: "of the work you set",
    },
    {
      label: "Average score",
      value: mentees.length > 0 ? String(averageScore) : "—",
      detail: "across your mentees",
    },
  ];

  const recommendations: ProfileRecommendation[] = [];

  if (waitingToMark.length > 0) {
    recommendations.push({
      resourceId: waitingToMark[0].id,
      title: waitingToMark[0].title,
      kind: "To mark",
      reason: `Something has been handed in and is waiting for a mark. ${waitingToMark.length} ${waitingToMark.length === 1 ? "is" : "are"} waiting in total.`,
    });
  }

  if (totalOverdue > 0) {
    const overdue = input.resources.find((r) => r.overdue);
    if (overdue) {
      recommendations.push({
        resourceId: overdue.id,
        title: overdue.title,
        kind: "Overdue",
        reason: `Your mentees have ${totalOverdue} ${totalOverdue === 1 ? "piece" : "pieces"} of work past the deadline.`,
      });
    }
  }

  if (input.resources.length === 0) {
    recommendations.push({
      resourceId: "",
      title: "Publish your first resource",
      kind: "Getting started",
      reason:
        "Your mentees cannot do anything until there is work set for them.",
    });
  } else {
    const undone = input.resources.filter((r) => r.status === "assigned");
    if (undone.length > 0) {
      recommendations.push({
        resourceId: undone[0].id,
        title: undone[0].title,
        kind: "Not started",
        reason: "Nobody has started this one yet. A nudge goes a long way.",
      });
    }
  }

  const levelNumber = Math.min(
    LEVEL_TITLES.length - 1,
    Math.floor(mentees.length / 2),
  );

  return {
    avatarSeed: `${input.id}:${input.name}`,
    archetype,
    headline: `${mentees.length} ${
      mentees.length === 1 ? "mentee" : "mentees"
    } and ${input.resources.length} ${
      input.resources.length === 1 ? "piece" : "pieces"
    } of work`,
    summary,
    badges,
    highlights,
    recommendations,
    level: {
      number: levelNumber + 1,
      title: LEVEL_TITLES[levelNumber],
      completed: mentees.length % 2,
      needed: 2,
      fraction: (mentees.length % 2) / 2,
    },
  };
}

/**
 * 1st, 2nd, 3rd, 4th.
 */
function ordinal(value: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const remainder = value % 100;
  return `${value}${suffixes[(remainder - 20) % 10] ?? suffixes[remainder] ?? "th"}`;
}
