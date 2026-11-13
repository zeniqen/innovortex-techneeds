import Link from "next/link";
import type { CSSProperties } from "react";
import {
  IconArrowDown,
  IconClock,
  IconFlame,
  IconSparkles,
} from "@tabler/icons-react";

import { Countdown } from "@/components/platform/countdown";
import { MarksList } from "@/components/platform/marks-list";
import { ResourceCard } from "@/components/platform/resource-card";
import { SinceLastVisit } from "@/components/platform/since-last-visit";
import { Tabs } from "@/components/platform/tabs";
import {
  ACCENTS,
  EmptyState,
  PanelCard,
  PanelShell,
  points,
  ResourceTypeChip,
  StatCard,
} from "@/components/platform/primitives";
import { currentTime } from "@/lib/platform/clock";
import { cn } from "@/lib/utils";
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

    // Within each tab, work still to do comes first, then what is handed
    // in and waiting, then what is marked. The sort is stable, so the
    // order the work was set in holds inside each group.
    const byStage = [...resources].sort((a, b) => stage(a) - stage(b));
    const videos = byStage.filter((resource) => resource.type === "video");
    const work = byStage.filter((resource) => resource.type !== "video");

    // Worked out here, on the server, so the countdown and the "due soon"
    // badges agree between the server's render and the browser's.
    const now = currentTime();
    const open = resources.filter((resource) => {
      const status = resource.progress?.status;
      return status !== "graded" && status !== "submitted";
    });
    const dueSoon = new Set(
      open
        .filter((resource) => {
          if (!resource.deadline || resource.overdue) return false;
          const left = new Date(resource.deadline).getTime() - now;
          return left >= 0 && left <= TWO_DAYS;
        })
        .map((resource) => resource.id),
    );
    // The next thing to do: the open piece of work with the nearest
    // deadline (overdue work first, since it is nearest of all), or the
    // first open one without a deadline.
    const next =
      [...open]
        .filter((resource) => resource.deadline)
        .sort(
          (a, b) =>
            new Date(a.deadline as string).getTime() -
            new Date(b.deadline as string).getTime(),
        )[0] ?? open[0] ?? null;

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
        <SinceLastVisit
          userId={user.id}
          events={events.map(({ id, createdAt, delta }) => ({
            id,
            createdAt,
            delta,
          }))}
        />

        <UpNext
          next={next}
          now={now}
          streak={profile?.streak ?? 0}
          openCount={open.length}
        />

        {/* Two to a row from the smallest screens up, so on a phone the
            four cards do not push the tabs a screen and a half down. */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard accent="violet" value={profile?.totalScore ?? 0} label="Points" />
          <StatCard accent="amber"
            value={myRank ? `#${myRank}` : "—"}
            label="On the leaderboard"
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
                    dueSoon={dueSoon}
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
                    dueSoon={dueSoon}
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
                      // The first 12, with a control to show the rest, so
                      // the tab's count and what can be seen always agree.
                      <MarksList
                        events={events.map(({ id, reason, delta }) => ({
                          id,
                          reason,
                          delta,
                        }))}
                      />
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
  dueSoon,
  title,
  description,
  emptyTitle,
  emptyDescription,
}: {
  resources: Awaited<ReturnType<typeof listMenteeResources>>;
  dueSoon: Set<string>;
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
            <ResourceCard
              key={resource.id}
              resource={resource}
              dueSoon={dueSoon.has(resource.id)}
            />
          ))}
        </ul>
      )}
    </PanelCard>
  );
}

/** Open work first, then handed in and waiting, then marked. */
function stage(resource: Awaited<ReturnType<typeof listMenteeResources>>[number]) {
  const status = resource.progress?.status;
  return status === "graded" ? 2 : status === "submitted" ? 1 : 0;
}

/** How close a deadline has to be to count as due soon. */
const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;

/**
 * The first thing on the mentee's dashboard: the one piece of work to do
 * next, how long is left on it, and a way straight to it.
 *
 * The block takes the colour of the kind of work it shows - violet for a
 * video, amber for a quiz, green for a project - so it changes as the work
 * does. Text stays in the page's ink: amber is too light to read as text.
 */
function UpNext({
  next,
  now,
  streak,
  openCount,
}: {
  next: Awaited<ReturnType<typeof listMenteeResources>>[number] | null;
  now: number;
  streak: number;
  openCount: number;
}) {
  const accent = next
    ? ACCENTS[
        next.type === "quiz" ? "amber" : next.type === "project" ? "green" : "violet"
      ]
    : ACCENTS.green;
  const after = openCount - 1;

  return (
    <section
      style={{ "--accent": accent } as CSSProperties}
      className="mb-6 rounded-2xl border border-[color-mix(in_srgb,var(--accent)_30%,var(--color-spotted-dove))] bg-[color-mix(in_srgb,var(--accent)_7%,var(--color-emptiness))] p-5 sm:p-7"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        {next ? (
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
              {next.title}
            </h2>
            <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-[var(--color-iron-fixture)]">
              <ResourceTypeChip type={next.type} />
              <span>Worth {points(next.maxScore)}</span>
              {next.deadline && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 font-semibold",
                    next.overdue
                      ? "text-[var(--color-loss)]"
                      : "text-[var(--color-caviar)]",
                  )}
                >
                  <IconClock
                    className="h-4 w-4"
                    style={next.overdue ? undefined : { color: "var(--accent)" }}
                  />
                  <Countdown deadline={next.deadline} serverNow={now} />
                </span>
              )}
            </p>
            <p className="mt-2 text-xs text-[var(--color-iron-fixture)]">
              Up next
              {after > 0
                ? `, with ${after} more ${after === 1 ? "piece" : "pieces"} of work after it.`
                : " - the last piece of work you have left."}
            </p>
          </div>
        ) : (
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              You are all caught up
            </h2>
            <p className="mt-2 text-sm text-[var(--color-iron-fixture)]">
              Everything you have been set is handed in or marked. New work
              shows up here as soon as a mentor publishes it.
            </p>
          </div>
        )}

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {next && (
            // Opens the tab the card is in and glides to it (see Tabs).
            <a
              href={`#resource-${next.id}`}
              className="tn-press inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-caviar)] px-4 py-2.5 text-xs font-bold text-[var(--color-emptiness)] hover:bg-[var(--color-iron-fixture)]"
            >
              Show me
              <IconArrowDown className="h-3.5 w-3.5" />
            </a>
          )}
          <Link
            href="/profile/me"
            className="tn-press inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-spotted-dove)] bg-[var(--color-emptiness)] px-4 py-2.5 text-xs font-bold text-[var(--color-caviar)] hover:bg-[var(--color-night-white)]"
          >
            <IconSparkles className="h-3.5 w-3.5" />
            My profile
          </Link>
        </div>
      </div>

      {streak > 0 && (
        <p className="mt-5 flex items-center gap-1.5 border-t border-[color-mix(in_srgb,var(--accent)_20%,var(--color-spotted-dove))] pt-4 text-xs font-semibold text-[var(--color-caviar)]">
          <IconFlame className="h-4 w-4 text-[var(--color-amber)]" />
          {streak} day streak. Hand something in today to keep it going.
        </p>
      )}
    </section>
  );
}
