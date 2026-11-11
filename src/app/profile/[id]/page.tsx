import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { ProfileView } from "@/components/platform/profile-view";
import { PanelSkeleton } from "@/components/platform/primitives";
import { requireUser } from "@/lib/platform/guards";
import { currentTime } from "@/lib/platform/clock";
import {
  getMentee,
  getMentor,
  leaderboard,
  listMenteeResources,
  listMenteesForProgram,
  listPrograms,
  listResources,
  scoreEventsFor,
} from "@/lib/platform/store";
import {
  buildProfile,
  type ProfileInput,
  type ProfileMentee,
  type ProfileResource,
} from "@/lib/platform/ai/profile";

export const metadata: Metadata = {
  title: "Profile | TechNeeds IGDTUW",
  description:
    "A participant's progress on the TechNeeds mentorship platform, turned into a profile.",
};

/**
 * This page reads the session cookie, so it cannot be prerendered into the
 * static shell. It blocks on the server instead.
 */
export const instant = false;

/**
 * Somebody's profile.
 *
 * The page works out what the person has done, hands that to the profile
 * engine, and shows what comes back.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <ProfileBody params={params} />
    </Suspense>
  );
}

async function ProfileBody({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const now = currentTime();
  const rows = await leaderboard(50);
  const programs = await listPrograms();

  const mentor = await getMentor(id);
  if (mentor) {
    const input = await mentorInput(
      mentor.id,
      mentor.name,
      mentor.skills,
      mentor.programIds,
      programs,
      rows,
    );

    return (
      <ProfileView
        profile={buildProfile(input, now)}
        role="mentor"
        leaderboard={rows}
        isSelf={user.id === mentor.id}
      />
    );
  }

  const mentee = await getMentee(id);
  if (!mentee) notFound();

  const input = await menteeInput(
    mentee.id,
    mentee.name,
    mentee.interests,
    mentee.programIds,
    mentee.totalScore,
    mentee.streak,
    rows,
    programs,
  );

  return (
    <ProfileView
      profile={buildProfile(input, now)}
      role="mentee"
      leaderboard={rows}
      isSelf={user.id === mentee.id}
    />
  );
}

/**
 * Gathers what is known about a mentee.
 */
async function menteeInput(
  id: string,
  name: string,
  interests: string[],
  programIds: string[],
  totalScore: number,
  streak: number,
  rows: Awaited<ReturnType<typeof leaderboard>>,
  programs: Awaited<ReturnType<typeof listPrograms>>,
): Promise<ProfileInput> {
  const resources = await listMenteeResources(id);
  const events = await scoreEventsFor(id);

  const resourceList: ProfileResource[] = resources.map((resource) => ({
    id: resource.id,
    title: resource.title,
    type: resource.type,
    tags: resource.tags,
    programId: resource.programId,
    programName:
      programs.find((program) => program.id === resource.programId)?.name ??
      "",
    maxScore: resource.maxScore,
    deadline: resource.deadline,
    status: resource.progress?.status ?? "assigned",
    score: resource.progress?.score ?? 0,
    overdue: resource.overdue,
  }));

  return {
    role: "mentee",
    id,
    name,
    interests,
    totalScore,
    streak,
    programs: programs.filter((program) => programIds.includes(program.id)),
    resources: resourceList,
    rank: rows.find((row) => row.id === id)?.rank ?? null,
    fieldSize: rows.length,
    scoreHistory: events.map((event) => ({
      resourceId: event.resourceId,
      at: event.createdAt,
      delta: event.delta,
    })),
  };
}

/**
 * Gathers what is known about a mentor.
 */
async function mentorInput(
  id: string,
  name: string,
  skills: string[],
  programIds: string[],
  programs: Awaited<ReturnType<typeof listPrograms>>,
  rows: Awaited<ReturnType<typeof leaderboard>>,
): Promise<ProfileInput> {
  const resourceList: ProfileResource[] = [];
  const mentees: ProfileMentee[] = [];

  for (const programId of programIds) {
    const people = await listMenteesForProgram(programId);

    // What each mentee has done with each resource. The mentor's view of
    // a resource is the sum of it across their mentees.
    const perMentee = await Promise.all(
      people.map(async (person) => ({
        person,
        resources: await listMenteeResources(person.id),
      })),
    );

    for (const resource of await listResources(programId)) {
      let submitted = 0;
      let overdue = 0;

      for (const { resources: their } of perMentee) {
        const theirs = their.find((entry) => entry.id === resource.id);
        if (!theirs) continue;
        if (theirs.progress?.status === "submitted") submitted++;
        if (theirs.overdue) overdue++;
      }

      resourceList.push({
        id: resource.id,
        title: resource.title,
        type: resource.type,
        tags: resource.tags,
        programId: resource.programId,
        programName:
          programs.find((program) => program.id === programId)?.name ?? "",
        maxScore: resource.maxScore,
        deadline: resource.deadline,
        // Anything somebody has handed in is waiting for the mentor.
        status: submitted > 0 ? "submitted" : "assigned",
        score: 0,
        overdue: overdue > 0,
      });
    }

    for (const { person, resources: their } of perMentee) {
      mentees.push({
        id: person.id,
        name: person.name,
        totalScore: person.totalScore,
        completed: their.filter(
          (resource) => resource.progress?.status === "graded",
        ).length,
        assigned: their.length,
        overdue: their.filter((resource) => resource.overdue).length,
      });
    }
  }

  return {
    role: "mentor",
    id,
    name,
    interests: skills,
    totalScore: 0,
    streak: 0,
    programs: programs.filter((program) => programIds.includes(program.id)),
    resources: resourceList,
    rank: null,
    fieldSize: rows.length,
    scoreHistory: [],
    mentees,
  };
}
