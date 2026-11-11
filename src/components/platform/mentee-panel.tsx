import Link from "next/link";
import { IconSparkles } from "@tabler/icons-react";

import { LiveLeaderboard } from "@/components/platform/live-leaderboard";
import { ResourceCard } from "@/components/platform/resource-card";
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard value={profile?.totalScore ?? 0} label="Points" />
        <StatCard
          value={myRank ? `#${myRank}` : "—"}
          label="On the leaderboard"
          hint={profile?.streak ? `${profile.streak} day streak` : undefined}
        />
        <StatCard value={`${completed}/${resources.length}`} label="Marked" />
        <StatCard
          value={handedIn}
          label="Handed in, waiting"
          tone={handedIn > 0 ? "warn" : "neutral"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PanelCard
            title="Your resources"
            description="Everything your mentors have set you. Work that is overdue is marked."
          >
            {resources.length === 0 ? (
              <EmptyState
                title="Nothing assigned yet"
                description="Your mentors have not set you any work."
              />
            ) : (
              <ul className="space-y-3">
                {resources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </ul>
            )}
          </PanelCard>

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
        </div>

        <div className="space-y-6">
          <PanelCard
            title="Leaderboard"
            description="Where you are, updated as other people hand work in."
          >
            <LiveLeaderboard currentId={user.id} fallback={rows} />
          </PanelCard>

          <PanelCard
            title="Your profile"
            description="Your progress, summarised and turned into a profile."
          >
            <Link
              href="/profile/me"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-caviar)] px-4 py-2.5 text-xs font-bold text-[var(--color-emptiness)] transition-colors hover:bg-[var(--color-iron-fixture)]"
            >
              <IconSparkles className="h-3.5 w-3.5" />
              Open my profile
            </Link>
          </PanelCard>
        </div>
      </div>
    </PanelShell>
  );
}
