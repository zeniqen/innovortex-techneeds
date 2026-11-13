import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";

import Footer from "@/components/footer";
import FloatingDockDemo from "@/components/floating-dock-demo";
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
import { buildProfileCharts } from "@/lib/platform/ai/charts";

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
    <div className="relative flex min-h-screen flex-col bg-[var(--color-emptiness)] text-[var(--color-caviar)] selection:bg-[var(--color-caviar)] selection:text-[var(--color-emptiness)]">
      <main className="flex-1">
        <Suspense fallback={<PanelSkeleton />}>
          <ProfileBody params={params} />
        </Suspense>
      </main>

      <Footer />
      <FloatingDockDemo />
    </div>
  );
}

async function ProfileBody({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  // An admin has no profile of their own - only mentors and mentees do -
  // so their own profile link takes them to their dashboard instead. They
  // can still open anybody else's profile.
  if (user.role === "admin" && (id === "me" || id === user.id)) {
    redirect("/techboard");
  }

  const now = currentTime();
  const rows = await leaderboard(50);
  const programs = await listPrograms();

  // "me" is what the navigation uses, so the profile link works without
  // the page having to know who is signed in.
  const wanted = id === "me" ? user.id : id;

  const mentor = await getMentor(wanted);
  if (mentor) {
    const input = await mentorInput(
      mentor.id,
      mentor.name,
      mentor.skills,
      mentor.programIds,
      programs,
      rows,
    );

    // Only the mentor's own mentees, at their place on the whole board.
    // A row is matched on the id, or on the name for the tn backend, which
    // sends the name in place of an id.
    const theirs = new Set(
      (input.mentees ?? []).flatMap((mentee) => [mentee.id, mentee.name]),
    );

    return (
      <ProfileView
        profile={buildProfile(input, now)}
        charts={buildProfileCharts(input)}
        role="mentor"
        leaderboard={rows.filter((row) => theirs.has(row.id))}
        isSelf={user.id === mentor.id}
      />
    );
  }

  const mentee = await getMentee(wanted);
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
      charts={buildProfileCharts(input)}
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
    url: resource.url,
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
    // The tn backend sends no id with a leaderboard row and uses the name
    // in its place, so the name is the fallback.
    rank: rows.find((row) => row.id === id || row.id === name)?.rank ?? null,
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
 *
 * A mentee on two of the mentor's programs is counted once, and only the
 * work on the mentor's own programs counts towards them.
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
  const ownPrograms = new Set(programIds);

  // Each mentee once, with what they have done on this mentor's programs.
  const people = new Map<
    string,
    Awaited<ReturnType<typeof listMenteesForProgram>>[number]
  >();
  for (const list of await Promise.all(programIds.map(listMenteesForProgram))) {
    for (const person of list) {
      if (!people.has(person.id)) people.set(person.id, person);
    }
  }

  const everyone = await Promise.all(
    [...people.values()].map(async (person) => ({
      person,
      resources: (await listMenteeResources(person.id)).filter((resource) =>
        ownPrograms.has(resource.programId),
      ),
    })),
  );

  for (const programId of programIds) {
    for (const resource of await listResources(programId)) {
      let submitted = 0;
      let overdue = 0;
      let started = 0;

      for (const { resources: their } of everyone) {
        const theirs = their.find((entry) => entry.id === resource.id);
        if (!theirs) continue;
        const status = theirs.progress?.status ?? "assigned";
        if (status === "submitted") submitted++;
        if (status !== "assigned") started++;
        // Handed in but not yet marked is waiting on the mentor, not late.
        if (theirs.overdue && (status === "assigned" || status === "in_progress")) {
          overdue++;
        }
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
        url: resource.url,
        submittedCount: submitted,
        overdueCount: overdue,
        startedCount: started,
      });
    }
  }

  const mentees: ProfileMentee[] = everyone.map(({ person, resources: their }) => ({
    id: person.id,
    name: person.name,
    totalScore: person.totalScore,
    completed: their.filter((resource) => resource.progress?.status === "graded")
      .length,
    assigned: their.length,
    overdue: their.filter((resource) => {
      const status = resource.progress?.status ?? "assigned";
      return (
        resource.overdue && (status === "assigned" || status === "in_progress")
      );
    }).length,
  }));

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
