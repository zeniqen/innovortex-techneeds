import Link from "next/link";

import {
  AddMenteeForm,
  GradeForm,
  PublishResourceForm,
  RemoveMenteeButton,
} from "@/components/platform/mentor-actions";
import {
  Chip,
  EmptyState,
  ListRow,
  PanelCard,
  PanelShell,
  ResourceTypeChip,
  StatCard,
} from "@/components/platform/primitives";
import { formatDate } from "@/lib/platform/dates";
import {
  listMenteesForProgram,
  listMentorResourceProgress,
  listPrograms,
  listResources,
} from "@/lib/platform/store";
import type { SessionUser } from "@/lib/platform/types";

/**
 * The mentor panel.
 *
 * A mentor sees the programs they run, the mentees on them, the
 * resources they have published, and the work waiting to be marked.
 */
export async function MentorPanel({
  user,
  programId,
}: {
  user: SessionUser;
  programId?: string;
}) {
  const programs = await listPrograms();
  const mine = programs.filter((program) =>
    user.programIds.includes(program.id),
  );
  const selected =
    mine.find((program) => program.id === programId) ?? mine[0] ?? null;

  if (!selected) {
    return (
      <PanelShell
        role="mentor"
        name={user.name}
        identifier={user.identifier}
        eyebrow="Mentor panel"
        title="No programs yet"
        description="An admin puts mentors on programs. Once you are on one, it shows up here."
      >
        <PanelCard>
          <EmptyState
            title="Nothing here yet"
            description="Ask an admin to put you on a program."
          />
        </PanelCard>
      </PanelShell>
    );
  }

  const mentees = await listMenteesForProgram(selected.id);
  const resources = await listResources(selected.id);
  const progress = await listMentorResourceProgress(user.id, selected.id);

  const awaiting = progress.flatMap((entry) =>
    entry.entries
      .filter((item) => item.progress?.status === "submitted")
      .map((item) => ({ resource: entry.resource, mentee: item.mentee })),
  );

  const totalScore = mentees.reduce((sum, mentee) => sum + mentee.totalScore, 0);

  return (
    <PanelShell
      role="mentor"
      name={user.name}
      identifier={user.identifier}
      eyebrow="Mentor panel"
      title={selected.name}
      description="Your mentees, the work you have set them, and the marks you have given."
    >
      {mine.length > 1 && (
        <nav className="mb-6 flex flex-wrap gap-2">
          {mine.map((program) => (
            <Link
              key={program.id}
              href={`/techboard?program=${program.id}`}
              aria-current={program.id === selected.id ? "page" : undefined}
              className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors duration-150 ${
                program.id === selected.id
                  ? "border-[var(--color-caviar)] bg-[var(--color-caviar)] text-[var(--color-emptiness)]"
                  : "border-[var(--color-spotted-dove)] text-[var(--color-caviar)] hover:bg-[var(--color-night-white)]"
              }`}
            >
              {program.name}
            </Link>
          ))}
        </nav>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard value={mentees.length} label="Mentees" />
        <StatCard value={resources.length} label="Resources" />
        <StatCard
          value={awaiting.length}
          label="Waiting to be marked"
          tone={awaiting.length > 0 ? "warn" : "neutral"}
        />
        <StatCard value={totalScore} label="Points earned by your mentees" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PanelCard
            title="Mentees"
            description="Everyone on this program. Each one signs in with an enrollment number."
          >
            {mentees.length === 0 ? (
              <EmptyState
                title="No mentees yet"
                description="Add the first one below."
              />
            ) : (
              <ul>
                {mentees.map((mentee) => (
                  <ListRow
                    key={mentee.id}
                    title={
                      <Link
                        href={`/profile/${mentee.id}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {mentee.name}
                      </Link>
                    }
                    meta={`${mentee.enrollmentNumber} · ${mentee.totalScore} points · ${mentee.streak} day streak`}
                    detail={
                      <span className="flex flex-wrap gap-1.5">
                        {mentee.interests.slice(0, 3).map((interest) => (
                          <Chip key={interest}>{interest}</Chip>
                        ))}
                      </span>
                    }
                    action={
                      <RemoveMenteeButton
                        programId={selected.id}
                        menteeId={mentee.id}
                        name={mentee.name}
                      />
                    }
                  />
                ))}
              </ul>
            )}
          </PanelCard>

          <PanelCard
            title="Resources"
            description="What you have set the mentees. Every mentee on the program starts with each one assigned."
          >
            {resources.length === 0 ? (
              <EmptyState
                title="Nothing published yet"
                description="Publish the first one on the right."
              />
            ) : (
              <ul>
                {resources.map((resource) => {
                  const submitted = progress
                    .find((entry) => entry.resource.id === resource.id)
                    ?.entries.filter(
                      (entry) => entry.progress?.status === "submitted",
                    ).length ?? 0;

                  return (
                    <ListRow
                      key={resource.id}
                      title={resource.title}
                      meta={`Worth ${resource.maxScore} points${resource.deadline ? ` · due ${formatDate(resource.deadline)}` : ""}`}
                      detail={
                        <span className="flex flex-wrap items-center gap-1.5">
                          <ResourceTypeChip type={resource.type} />
                          {submitted > 0 && (
                            <Chip tone="warn">{submitted} to mark</Chip>
                          )}
                        </span>
                      }
                    />
                  );
                })}
              </ul>
            )}
          </PanelCard>

          <PanelCard
            title="Marking"
            description="Work that has been handed in and has not been given a mark yet."
          >
            {awaiting.length === 0 ? (
              <EmptyState
                title="Nothing waiting"
                description="Everything handed in has been marked."
              />
            ) : (
              <ul className="space-y-5">
                {awaiting.map((entry) => (
                  <li
                    key={`${entry.resource.id}-${entry.mentee.id}`}
                    className="rounded-xl border border-[var(--color-night-white)] p-4"
                  >
                    <p className="text-sm font-bold">{entry.mentee.name}</p>
                    <p className="mt-0.5 mb-3 text-xs text-[var(--color-iron-fixture)]">
                      {entry.resource.title} · worth {entry.resource.maxScore}{" "}
                      points
                    </p>
                    <GradeForm
                      resourceId={entry.resource.id}
                      menteeId={entry.mentee.id}
                      maxScore={entry.resource.maxScore}
                    />
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>
        </div>

        <div className="space-y-6">
          <PanelCard
            title="Add a mentee"
            description="They get an enrollment number and an initial password. You hand them over."
          >
            <AddMenteeForm programId={selected.id} />
          </PanelCard>

          <PanelCard
            title="Publish a resource"
            description="A video to watch, a quiz to sit, or a project to build."
          >
            <PublishResourceForm programId={selected.id} />
          </PanelCard>
        </div>
      </div>
    </PanelShell>
  );
}
