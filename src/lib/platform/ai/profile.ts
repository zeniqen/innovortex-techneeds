import type { ResourceType } from "../types";
import { daysUntil, formatDate } from "../dates";

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
  /** Where the work lives (a video, a quiz, a brief), when there is a link. */
  url?: string;
  /** For a mentor: how many mentees have handed it in and are waiting for a mark. */
  submittedCount?: number;
  /** For a mentor: how many mentees are past the deadline without handing it in. */
  overdueCount?: number;
  /** For a mentor: how many mentees have started it, handed it in or been marked. */
  startedCount?: number;
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
  /** Where the work is: the resource's own link, or the dashboard. */
  href?: string;
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
 * Each kind of work, as a plural noun and with "a" in front.
 */
const KIND_PLURAL: Record<ResourceType, string> = {
  video: "videos",
  quiz: "quizzes",
  project: "projects",
};

const KIND_ONE: Record<ResourceType, string> = {
  video: "a video",
  quiz: "a quiz",
  project: "a project",
};

const KIND_TITLE: Record<ResourceType, string> = {
  video: "Video",
  quiz: "Quiz",
  project: "Project",
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
 * Where a mentor (and a mentee with no link to follow) does the work.
 */
const DASHBOARD = "/techboard";

/**
 * Turns a list into a sentence with "and" at the end.
 */
function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * A count with the right word: "1 piece", "3 pieces".
 */
function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

function capitalise(text: string): string {
  return text.length > 0 ? `${text[0].toUpperCase()}${text.slice(1)}` : text;
}

/**
 * The kind of work they have finished most of, or null when nothing is
 * finished or two kinds are level.
 */
function strongestKind(
  byType: Record<ResourceType, number>,
): ResourceType | null {
  const ordered = (Object.keys(byType) as ResourceType[]).sort(
    (a, b) => byType[b] - byType[a],
  );
  const [first, second] = ordered;
  if (byType[first] === 0) return null;
  if (byType[first] === byType[second]) return null;
  return first;
}

/**
 * Works out the profile.
 */
export function buildProfile(input: ProfileInput, now: number): AiProfile {
  return input.role === "mentor"
    ? buildMentorProfile(input, now)
    : buildMenteeProfile(input, now);
}

/**
 * The profile of a mentee.
 */
function buildMenteeProfile(input: ProfileInput, now: number): AiProfile {
  const graded = input.resources.filter((r) => r.status === "graded");
  const completed = graded.filter((r) => r.score > 0 || r.maxScore === 0);
  const handedIn = input.resources.filter((r) => r.status === "submitted");
  // Still to do: neither handed in nor marked. Work that is handed in but
  // not yet marked is waiting on the mentor, so it is not overdue.
  const toDo = input.resources.filter(
    (r) => r.status === "assigned" || r.status === "in_progress",
  );
  const overdue = toDo.filter((r) => r.overdue);

  const byType: Record<ResourceType, number> = { video: 0, quiz: 0, project: 0 };
  for (const resource of completed) byType[resource.type]++;
  const strongest = strongestKind(byType);

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
    byType,
    marked: graded.length,
    overdue,
    average,
    onTime,
  });

  const archetype = menteeArchetype({
    completed: completed.length,
    strongest,
    streak: input.streak,
    rank: input.rank,
  });

  const points = plural(input.totalScore, "point", "points");

  // --- the summary, one fact per sentence -------------------------------
  const sentences: string[] = [];

  if (graded.length > 0) {
    sentences.push(
      `You have ${points}, and ${plural(graded.length, "piece", "pieces")} of your work ${
        graded.length === 1 ? "has" : "have"
      } been marked, averaging ${average}%.`,
    );
  } else if (input.totalScore > 0) {
    sentences.push(`You have ${points}, and nothing has been marked yet.`);
  } else {
    sentences.push("You have no points yet, and nothing has been marked.");
  }

  sentences.push(
    input.rank === null
      ? "You are not on the leaderboard yet."
      : input.rank === 1
        ? "You are top of the leaderboard."
        : `You are ${ordinal(input.rank)} on the leaderboard.`,
  );

  if (strongest) {
    const count = byType[strongest];
    if (count === completed.length) {
      sentences.push(
        count === 1
          ? `The one piece you have finished is ${KIND_ONE[strongest]}.`
          : count === 2
            ? `Both pieces you have finished are ${KIND_PLURAL[strongest]}.`
            : `All ${count} pieces you have finished are ${KIND_PLURAL[strongest]}.`,
      );
    } else {
      sentences.push(
        `${capitalise(KIND_PLURAL[strongest])} lead what you have finished, with ${count} of ${completed.length}.`,
      );
    }
  }

  const programNames = new Set(input.programs.map((p) => p.name.toLowerCase()));
  const topic = mostCommonTag(completed);
  if (topic && topic.count >= 2 && !programNames.has(topic.tag.toLowerCase())) {
    sentences.push(
      `${topic.count} of your finished pieces are on ${topic.tag}, more than any other topic.`,
    );
  }

  if (toDo.length > 0) {
    let line = `${plural(toDo.length, "piece", "pieces")} of work ${
      toDo.length === 1 ? "is" : "are"
    } still to do`;
    if (overdue.length === toDo.length) {
      line +=
        toDo.length === 1
          ? ", and it is past its deadline"
          : ", and all of them are past their deadline";
    } else if (overdue.length > 0) {
      line += `, ${overdue.length} of them past ${
        overdue.length === 1 ? "its" : "their"
      } deadline`;
    }
    sentences.push(`${line}.`);
  }
  if (handedIn.length > 0) {
    sentences.push(
      `${plural(handedIn.length, "piece is", "pieces are")} handed in and waiting for a mark.`,
    );
  }
  if (input.resources.length > 0 && graded.length === input.resources.length) {
    sentences.push("Everything set for you has been marked.");
  }

  if (input.programs.length > 0) {
    sentences.push(
      `You are enrolled in ${joinList(input.programs.map((p) => p.name))}.`,
    );
  }

  const summary = sentences.join(" ");

  const headline =
    completed.length === 0
      ? "Ready for the first one"
      : input.streak > 0
        ? `${points} and ${plural(input.streak, "day", "days")} in a row`
        : `${points} from ${plural(completed.length, "finished piece", "finished pieces")} of work`;

  const highlights: ProfileHighlight[] = [
    {
      label: "Points",
      value: String(input.totalScore),
      detail:
        graded.length > 0
          ? `${plural(graded.length, "piece", "pieces")} marked`
          : "nothing marked yet",
    },
    {
      label: "Completion",
      value: `${completed.length}/${input.resources.length}`,
      detail: `${input.resources.length === 1 ? "piece" : "pieces"} of work finished`,
    },
    {
      label: "Average mark",
      value: graded.length > 0 ? `${average}%` : "—",
      detail: graded.length > 0 ? "across everything marked" : "no marks yet",
    },
    {
      label: "Streak",
      value: `${input.streak}`,
      detail: `${input.streak === 1 ? "day" : "days"} in a row`,
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
    recommendations: recommend({ input, now, toDo, completed, byType, strongest }),
    level,
  };
}

/**
 * The badges a mentee has earned.
 */
function menteeBadges(args: {
  input: ProfileInput;
  completed: ProfileResource[];
  byType: Record<ResourceType, number>;
  marked: number;
  overdue: ProfileResource[];
  average: number;
  onTime: number;
}): ProfileBadge[] {
  const { input, completed, byType, marked, overdue, average, onTime } = args;
  const badges: ProfileBadge[] = [];

  if (completed.length >= 1) {
    badges.push({
      id: "first-steps",
      label: "First steps",
      description: "Finished a first piece of work.",
      tone: "good",
    });
  }
  if (completed.length >= 5) {
    badges.push({
      id: "quick-study",
      label: "Quick study",
      description: `Finished ${completed.length} pieces of work; the badge comes at five.`,
      tone: "good",
    });
  }
  if (completed.length >= 10) {
    badges.push({
      id: "deep-diver",
      label: "Deep diver",
      description: `Finished ${completed.length} pieces of work; the badge comes at ten.`,
      tone: "good",
    });
  }

  if (byType.quiz >= 3) {
    badges.push({
      id: "quiz-whiz",
      label: "Quiz whiz",
      description: `Scored on ${byType.quiz} quizzes.`,
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
      description: `Finished ${byType.video} videos.`,
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
      description: `${input.totalScore} points: past a hundred.`,
      tone: "good",
    });
  }

  if (marked >= 3 && average >= 95) {
    badges.push({
      id: "perfectionist",
      label: "Perfectionist",
      description: `Averaging ${average}% across ${marked} marked pieces of work.`,
      tone: "good",
    });
  }

  if (onTime >= 3) {
    badges.push({
      id: "on-time",
      label: "Right on time",
      description: `${onTime} pieces of work handed in and marked before the deadline.`,
      tone: "good",
    });
  }

  if (overdue.length > 0) {
    badges.push({
      id: "overdue",
      label: `${overdue.length} overdue`,
      description: `${plural(overdue.length, "piece of work is", "pieces of work are")} past the deadline and not handed in.`,
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
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .slice(0, 4)) {
    badges.push({
      id: `tag-${tag}`,
      label: tag,
      description: `Finished ${count} pieces of work on ${tag}.`,
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
  strongest: ResourceType | null;
  streak: number;
  rank: number | null;
}): AiProfile["archetype"] {
  const { completed, strongest, streak, rank } = args;

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
        "A streak of three days or more and a place in the top three. People are following this one.",
    };
  }

  if (strongest === "project") {
    return {
      name: "The Builder",
      description:
        "Learns by making things: more projects finished than any other kind of work.",
    };
  }
  if (strongest === "quiz") {
    return {
      name: "The Analyst",
      description:
        "Sharp with the fundamentals: more quizzes finished than any other kind of work.",
    };
  }
  if (strongest === "video") {
    return {
      name: "The Explorer",
      description:
        "Broad and curious: more videos finished than any other kind of work.",
    };
  }
  return {
    name: "The All-rounder",
    description:
      "No single kind of work leads: the finished pieces are spread evenly.",
  };
}

/**
 * The most common tag on what they have finished, and how many carry it.
 * A tie goes to the tag that sorts first, so the answer never changes.
 */
function mostCommonTag(
  completed: ProfileResource[],
): { tag: string; count: number } | null {
  const counts = new Map<string, number>();
  for (const resource of completed) {
    for (const tag of resource.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  let best: { tag: string; count: number } | null = null;
  for (const [tag, count] of counts) {
    if (
      !best ||
      count > best.count ||
      (count === best.count && tag < best.tag)
    ) {
      best = { tag, count };
    }
  }
  return best;
}

/**
 * Where a piece of work lives: its own link when it has one, otherwise
 * the dashboard it is listed on.
 */
function linkFor(resource: ProfileResource): string {
  const url = resource.url?.trim();
  return url ? url : DASHBOARD;
}

/**
 * What to work on next.
 *
 * Only work that is still to do is considered: anything handed in or
 * marked is left out. Each piece is weighed on what is true of it -
 * overdue, due soon, on a stated interest, worth the most points, of the
 * kind they are strongest at, next to what they have finished, already
 * started - and the reason shown is the strongest one or two of those, so
 * every suggestion can be checked against the numbers.
 */
function recommend(args: {
  input: ProfileInput;
  now: number;
  toDo: ProfileResource[];
  completed: ProfileResource[];
  byType: Record<ResourceType, number>;
  strongest: ResourceType | null;
}): ProfileRecommendation[] {
  const { input, now, toDo, completed, byType, strongest } = args;
  if (toDo.length === 0) return [];

  const interests = new Map(
    input.interests.map((tag) => [tag.toLowerCase(), tag] as const),
  );

  const doneTags = new Set<string>();
  for (const resource of completed) {
    for (const tag of resource.tags) doneTags.add(tag.toLowerCase());
  }

  const topPoints = Math.max(...toDo.map((r) => r.maxScore));
  const topCount = toDo.filter((r) => r.maxScore === topPoints).length;

  const scored = toDo
    .map((resource) => {
      const daysLeft = daysUntil(resource.deadline, now);
      const due = formatDate(resource.deadline);
      const reasons: { weight: number; text: string }[] = [];

      if (resource.overdue || (daysLeft !== null && daysLeft < 0)) {
        reasons.push({
          weight: 6,
          text: due
            ? `It was due on ${due} — hand it in to stop losing ground.`
            : "It is past its deadline — hand it in to stop losing ground.",
        });
      } else if (daysLeft !== null && daysLeft <= 7) {
        reasons.push({
          weight: daysLeft <= 2 ? 5 : 4,
          text:
            daysLeft === 0
              ? `Due today, ${due}.`
              : daysLeft === 1
                ? `Due tomorrow, ${due}.`
                : `Due in ${daysLeft} days, on ${due}.`,
        });
      }

      const interest = resource.tags.find((tag) =>
        interests.has(tag.toLowerCase()),
      );
      if (interest) {
        reasons.push({
          weight: 3,
          text: `Matches your interest in ${interests.get(interest.toLowerCase())}.`,
        });
      }

      if (toDo.length > 1 && topPoints > 0 && resource.maxScore === topPoints) {
        reasons.push({
          weight: 2,
          text:
            topCount === 1
              ? `Worth ${topPoints} points, the most of anything you have left.`
              : `Worth ${topPoints} points, joint most of anything you have left.`,
        });
      }

      if (strongest && resource.type === strongest && byType[strongest] >= 2) {
        reasons.push({
          weight: 2,
          text: `It is ${KIND_ONE[strongest]}, your strongest kind of work: you have finished ${byType[strongest]} ${KIND_PLURAL[strongest]}.`,
        });
      }

      const adjacent = resource.tags.find(
        (tag) => tag !== interest && doneTags.has(tag.toLowerCase()),
      );
      if (adjacent) {
        reasons.push({
          weight: 1,
          text: `Builds on ${adjacent}, which you have already finished work on.`,
        });
      }

      if (resource.status === "in_progress") {
        reasons.push({ weight: 1, text: "You have already started it." });
      }

      if (reasons.length === 0) {
        reasons.push({
          weight: 0,
          text: due ? `Due on ${due}.` : "Still to do, with no deadline set.",
        });
      }

      const score = reasons.reduce((sum, reason) => sum + reason.weight, 0);
      return { resource, score, reasons, daysLeft };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // The soonest deadline wins a tie, then the title, so the order
      // never changes from one visit to the next.
      const aDays = a.daysLeft ?? Number.MAX_SAFE_INTEGER;
      const bDays = b.daysLeft ?? Number.MAX_SAFE_INTEGER;
      if (aDays !== bDays) return aDays - bDays;
      return a.resource.title < b.resource.title ? -1 : 1;
    })
    .slice(0, 4);

  return scored.map((entry) => ({
    resourceId: entry.resource.id,
    title: entry.resource.title,
    kind: KIND_TITLE[entry.resource.type],
    // The strongest two reasons. The sort is stable, so reasons of the
    // same weight keep the order they were written in.
    reason: [...entry.reasons]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 2)
      .map((reason) => reason.text)
      .join(" "),
    due: entry.resource.deadline ?? undefined,
    href: linkFor(entry.resource),
  }));
}

/**
 * The middle value of a list of numbers.
 */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * The tiers of the mentor-of badge, largest first.
 */
const MENTOR_TIERS = [50, 20, 10, 5];

/**
 * The profile of a mentor.
 */
function buildMentorProfile(input: ProfileInput, now: number): AiProfile {
  const mentees = input.mentees ?? [];
  const totalAssigned = mentees.reduce((sum, m) => sum + m.assigned, 0);
  const totalCompleted = mentees.reduce((sum, m) => sum + m.completed, 0);
  const totalOverdue = mentees.reduce((sum, m) => sum + m.overdue, 0);
  const withOverdue = mentees.filter((m) => m.overdue > 0).length;
  const scoring = mentees.filter((m) => m.totalScore > 0);
  const middleScore = median(mentees.map((m) => m.totalScore));
  const leader = [...mentees].sort(
    (a, b) => b.totalScore - a.totalScore || (a.name < b.name ? -1 : 1),
  )[0];
  const completionRate =
    totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

  const waitingToMark = input.resources.filter((r) => r.status === "submitted");
  const handIns = waitingToMark.reduce(
    (sum, r) => sum + Math.max(1, r.submittedCount ?? 1),
    0,
  );

  const programCount = input.programs.length;
  const programPhrase =
    programCount === 0
      ? "no program yet"
      : programCount <= 3
        ? joinList(input.programs.map((p) => p.name))
        : `${programCount} programs`;

  const badges: ProfileBadge[] = [];

  const tier = MENTOR_TIERS.find((size) => mentees.length >= size);
  if (tier) {
    badges.push({
      id: `mentor-of-${tier}`,
      label: `Mentor of ${tier}+`,
      description: `Looks after ${mentees.length} mentees.`,
      tone: "good",
    });
  } else if (mentees.length >= 1) {
    badges.push({
      id: "first-mentee",
      label: "First mentee",
      description: `Looks after ${plural(mentees.length, "mentee", "mentees")}.`,
      tone: "good",
    });
  }
  if (programCount >= 2) {
    badges.push({
      id: "program-builder",
      label: "Program builder",
      description: `Runs ${programCount} programs at once.`,
      tone: "good",
    });
  }
  if (completionRate >= 60 && totalCompleted > 0) {
    badges.push({
      id: "mover",
      label: "Mover",
      description: `${completionRate}% of the work set for your mentees has been marked (${totalCompleted} of ${totalAssigned}).`,
      tone: "good",
    });
  }
  // Awarded on the median rather than the average, so one high scorer
  // cannot carry a group where most have nothing.
  if (mentees.length >= 3 && middleScore >= 50) {
    badges.push({
      id: "high-flyers",
      label: "High flyers",
      description: `Half your mentees have ${middleScore} points or more.`,
      tone: "good",
    });
  }
  if (totalOverdue > 0) {
    badges.push({
      id: "chasing",
      label: `${totalOverdue} overdue`,
      description: `${
        withOverdue === 1 ? "One mentee has" : `${withOverdue} mentees have`
      } work past its deadline and not handed in.`,
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
              "Mentees here get through what they are set: most of it has been marked.",
          }
        : completionRate >= 30
          ? {
              name: "The Anchor",
              description:
                "Steady progress: a good share of what is set here has been marked.",
            }
          : {
              name: "The Gardener",
              description:
                "Early days: most of what is set here has not been marked yet, so there is plenty still to grow.",
            };

  let summary: string;
  if (mentees.length === 0) {
    summary =
      "You are not looking after anybody yet. Once mentees are added to your program, they and their progress show up here.";
  } else {
    const sentences = [
      `You look after ${plural(mentees.length, "mentee", "mentees")} in ${programPhrase}.`,
    ];
    if (totalAssigned > 0) {
      sentences.push(
        `${completionRate}% of the work set for them has been marked (${totalCompleted} of ${totalAssigned}).`,
      );
    }
    if (scoring.length === 0) {
      sentences.push(
        mentees.length === 1
          ? "They have not scored any points yet."
          : "None of them has scored any points yet.",
      );
    } else if (scoring.length === mentees.length) {
      sentences.push(
        mentees.length === 1
          ? `They have ${plural(leader.totalScore, "point", "points")}.`
          : `All of them have scored, led by ${leader.name} with ${plural(leader.totalScore, "point", "points")}.`,
      );
    } else {
      sentences.push(
        `${scoring.length} of them ${
          scoring.length === 1 ? "has" : "have"
        } scored so far, led by ${leader.name} with ${plural(leader.totalScore, "point", "points")}.`,
      );
    }
    if (handIns > 0) {
      sentences.push(
        `${plural(handIns, "hand-in is", "hand-ins are")} waiting for your mark.`,
      );
    }
    summary = sentences.join(" ");
  }

  const highlights: ProfileHighlight[] = [
    {
      label: "Mentees",
      value: String(mentees.length),
      detail: `on ${plural(programCount, "program", "programs")}`,
    },
    {
      label: "Published",
      value: String(input.resources.length),
      detail:
        handIns > 0
          ? `${plural(handIns, "hand-in", "hand-ins")} to mark`
          : "nothing waiting to mark",
    },
    {
      label: "Marked",
      value: totalAssigned > 0 ? `${completionRate}%` : "—",
      detail:
        totalAssigned > 0
          ? `${totalCompleted} of ${totalAssigned} pieces of work`
          : "nothing set yet",
    },
    {
      label: "Scoring",
      value: mentees.length > 0 ? `${scoring.length}/${mentees.length}` : "—",
      detail:
        mentees.length > 0
          ? `mentees with points · median ${middleScore}`
          : "no mentees yet",
    },
  ];

  const recommendations: ProfileRecommendation[] = [];

  if (waitingToMark.length > 0) {
    const first = [...waitingToMark].sort(
      (a, b) => (b.submittedCount ?? 1) - (a.submittedCount ?? 1),
    )[0];
    const here = Math.max(1, first.submittedCount ?? 1);
    recommendations.push({
      resourceId: first.id,
      title: first.title,
      kind: "To mark",
      reason: `${plural(here, "mentee has", "mentees have")} handed this in and ${
        here === 1 ? "is" : "are"
      } waiting for a mark.${
        waitingToMark.length > 1
          ? ` ${handIns} hand-ins are waiting across ${waitingToMark.length} resources.`
          : ""
      }`,
      href: DASHBOARD,
    });
  }

  const overdueResources = input.resources.filter((r) => r.overdue);
  if (overdueResources.length > 0) {
    const worst = [...overdueResources].sort(
      (a, b) => (b.overdueCount ?? 1) - (a.overdueCount ?? 1),
    )[0];
    const late = Math.max(1, worst.overdueCount ?? 1);
    const due = formatDate(worst.deadline);
    recommendations.push({
      resourceId: worst.id,
      title: worst.title,
      kind: "Overdue",
      reason: `${plural(late, "mentee is", "mentees are")} past the deadline on this${
        due ? `, which was due on ${due}` : ""
      }. A reminder could bring ${late === 1 ? "it" : "them"} in.`,
      due: worst.deadline ?? undefined,
      href: DASHBOARD,
    });
  }

  if (input.resources.length === 0) {
    recommendations.push({
      resourceId: "",
      title: "Publish your first resource",
      kind: "Getting started",
      reason:
        "Your mentees cannot do anything until there is work set for them.",
      href: DASHBOARD,
    });
  } else if (mentees.length > 0) {
    // Work nobody has touched, soonest deadline first.
    const untouched = input.resources
      .filter((r) =>
        r.startedCount !== undefined ? r.startedCount === 0 : r.status === "assigned",
      )
      .filter((r) => !r.overdue)
      .sort((a, b) => {
        const aDays = daysUntil(a.deadline, now) ?? Number.MAX_SAFE_INTEGER;
        const bDays = daysUntil(b.deadline, now) ?? Number.MAX_SAFE_INTEGER;
        return aDays - bDays || (a.title < b.title ? -1 : 1);
      });
    if (untouched.length > 0) {
      const first = untouched[0];
      const due = formatDate(first.deadline);
      recommendations.push({
        resourceId: first.id,
        title: first.title,
        kind: "Not started",
        reason: `None of your mentees has started this yet${
          due ? `, and it is due on ${due}` : ""
        }. A nudge goes a long way.`,
        due: first.deadline ?? undefined,
        href: DASHBOARD,
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
    headline: `${plural(mentees.length, "mentee", "mentees")} and ${plural(
      input.resources.length,
      "published resource",
      "published resources",
    )}`,
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
