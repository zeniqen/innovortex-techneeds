import Link from "next/link";
import { IconSparkles } from "@tabler/icons-react";

import { ResourceCard } from "@/components/platform/resource-card";
import { Tabs } from "@/components/platform/tabs";
import {
  EmptyState,
  PanelCard,
  PanelShell,
  StatCard,
} from "@/components/platform/primitives";
import {
  getMentee,
  leaderboard,
  listMenteeResources,
  listPrograms,
  scoreEventsFor,
} from "@/lib/platform/store";
import type { SessionUser } from "@/lib/platform/types";

/**
 * The mentee panel.
 *
 * A mentee sees the work they have been set, what it is worth, when it is
 * due, and where they are on the leaderboard.
 */
export async function MenteePanel({ user }: { user: SessionUser }) {

    const mentee = await getMentee(user.id);
    const profile = mentee;

    const resources = await listMenteeResources(user.id);
    const rows = await leaderboard(50);
    const events = await scoreEventsFor(user.id);

    const programs = await listPrograms();
    const myPrograms = programs.filter((program) =>
      profile?.programIds.includes(program.id),
    );

    const completed = resources.filter(
      (resource) => resource.progress?.status === "graded",
    ).length;
    const handedIn = resources.filter(
      (resource) => resource.progress?.status === "submitted",
    ).length;
    const myRank = rows.find((row) => row.id === user.id)?.rank ?? null;

    const videos = resources.filter((resource) => resource.type === "video");
    const work = resources.filter((resource) => resource.type !== "video");

    return (
      <PanelShell
        role="mentee"
        name={user.name}
        identifier={user.identifier}
        eyebrow="Mentee panel"
        title="Your work"
        description={
          myPrograms.length
            ? `On ${myPrograms.map((program) => program.name).join(", ")}.`
            : "You are not on a program yet."
        }
      >
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Link
            href="/profile/me"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-caviar)] px-4 py-2.5 text-xs font-bold text-[var(--color-emptiness)] transition-colors hover:bg-[var(--color-iron-fixture)]"
          >
            <IconSparkles className="h-3.5 w-3.5" />
            Open my profile
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard accent="violet" value={profile?.totalScore ?? 0} label="Points" />
          <StatCard accent="amber"
            value={myRank ? `#${myRank}` : "—"}
            label="On the leaderboard"
            hint={profile?.streak ? `${profile.streak} day streak` : undefined}
          />
          <StatCard accent="green" value={`${completed}/${resources.length}`} label="Marked" />
          <StatCard accent="bronze"
            value={handedIn}
            label="Handed in, waiting"
            tone={handedIn > 0 ? "warn" : "neutral"}
          />
        </div>

        {/* One long page of everything became hard to find your way
            around, so each kind of thing has its own tab. Videos are
            separate from the work that is marked, because watching and
            handing in are different jobs. */}
        <div className="mt-6">
          <Tabs
            tabs={[
              {
                id: "videos",
                label: "Videos",
                count: videos.length,
                content: (
                  <ResourceList
                    resources={videos}
                    title="Videos"
                    description="Watch them and mark them as watched. Overdue ones are marked."
                    emptyTitle="No videos yet"
                    emptyDescription="Your mentors have not set you any videos."
                  />
                ),
              },
              {
                id: "work",
                label: "Quizzes & projects",
                count: work.length,
                content: (
                  <ResourceList
                    resources={work}
                    title="Quizzes and projects"
                    description="The work you hand in and get marked on. Overdue work is marked."
                    emptyTitle="Nothing to hand in yet"
                    emptyDescription="Your mentors have not set you a quiz or a project."
                  />
                ),
              },
              {
                id: "marks",
                label: "Marks",
                count: events.length,
                content: (
                  <PanelCard
                    title="Your marks"
                    description="Every mark you have been given, most recent first."
                  >
                    {events.length === 0 ? (
                      <EmptyState
                        title="No marks yet"
                        description="Marks appear here once a mentor grades your work."
                      />
                    ) : (
                      <ul className="space-y-2">
                        {events.slice(0, 12).map((event) => (
                          <li
                            key={event.id}
                            className="flex items-center justify-between gap-3 border-b border-[var(--color-night-white)] py-2 text-sm last:border-b-0"
                          >
                            <span className="min-w-0 truncate">{event.reason}</span>
                            <span className="shrink-0 font-bold tabular-nums">
                              {event.delta > 0 ? "+" : ""}
                              {event.delta}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </PanelCard>
                ),
              },
            ]}
          />
        </div>
      </PanelShell>
    );

}

/**
 * One kind of resource, as a card of resource cards.
 */
function ResourceList({
  resources,
  title,
  description,
  emptyTitle,
  emptyDescription,
}: {
  resources: Awaited<ReturnType<typeof listMenteeResources>>;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <PanelCard title={title} description={description}>
      {resources.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </ul>
      )}
    </PanelCard>
  );
}
