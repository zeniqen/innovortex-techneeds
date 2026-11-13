import Link from "next/link";
import { IconUpload, IconUserPlus } from "@tabler/icons-react";

import { ActionBar, ModalButton } from "@/components/platform/modal";
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
import { formatDate, formatDateTime } from "@/lib/platform/dates";
import {
  listMenteesForProgram,
  listMentorResourceProgress,
  listPrograms,
  listResources,
} from "@/lib/platform/store";
import type { SessionUser, Submission } from "@/lib/platform/types";

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
        .map((item) => ({
          resource: entry.resource,
          mentee: item.mentee,
          submission: item.submission,
        })),
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

        {/* The two things a mentor comes here to do, first. Each form opens
            over the page rather than waiting at the bottom of it. */}
        <ActionBar>
          <ModalButton
            label="Add a mentee"
            icon={<IconUserPlus className="h-3.5 w-3.5" />}
            title="Add a mentee"
            description="They get an enrollment number and an initial password. You hand them over."
          >
            <AddMenteeForm programId={selected.id} />
          </ModalButton>
          <ModalButton
            label="Publish a resource"
            icon={<IconUpload className="h-3.5 w-3.5" />}
            title="Publish a resource"
            description="A video to watch, a quiz to sit, or a project to build."
            tone="secondary"
          >
            <PublishResourceForm programId={selected.id} />
          </ModalButton>
        </ActionBar>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard accent="violet" value={mentees.length} label="Mentees" />
          <StatCard accent="amber" value={resources.length} label="Resources" />
          <StatCard accent="green"
            value={awaiting.length}
            label="Waiting to be marked"
            tone={awaiting.length > 0 ? "warn" : "neutral"}
          />
          <StatCard accent="bronze" value={totalScore} label="Points earned by your mentees" />
        </div>

        <div className="mt-6 space-y-6">
          {/* Work to mark is the thing that is waiting on the mentor, so it
              comes before the lists - and only when there is some. */}
          {awaiting.length > 0 && (
            <PanelCard
              title="Marking"
              description="Work that has been handed in and has not been given a mark yet."
            >
              <ul className="grid gap-4 md:grid-cols-2">
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
                    <HandedIn submission={entry.submission} />
                    <GradeForm
                      resourceId={entry.resource.id}
                      menteeId={entry.mentee.id}
                      maxScore={entry.resource.maxScore}
                    />
                  </li>
                ))}
              </ul>
            </PanelCard>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <PanelCard
              title="Mentees"
              description="Everyone on this program. Each one signs in with an enrollment number."
            >
              {mentees.length === 0 ? (
                <EmptyState
                  title="No mentees yet"
                  description="Add the first one with the button above."
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
                  description="Publish the first one with the button above."
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
          </div>
        </div>
      </PanelShell>
    );

}

/**
 * What a mentee handed in, shown above the mark so the mentor reads the
 * work before scoring it. Links open in a new tab; anything else keeps
 * its line breaks.
 */
function HandedIn({ submission }: { submission: Submission | null }) {
  const body = submission?.body.trim() ?? "";

  return (
    <div className="mb-4 rounded-lg bg-[var(--color-night-white)] px-3 py-2.5">
      <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-[var(--color-iron-fixture)]">
        Handed in
        {submission?.submittedAt && (
          <span className="normal-case tracking-normal">
            {" "}
            · {formatDateTime(submission.submittedAt)}
          </span>
        )}
      </p>
      {!submission ? (
        <p className="mt-1 text-xs text-[var(--color-iron-fixture)]">
          The work isn&apos;t available here.
        </p>
      ) : body === "" ? (
        <p className="mt-1 text-xs text-[var(--color-iron-fixture)]">
          Marked as done, with nothing attached.
        </p>
      ) : (
        <p className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap break-words text-sm">
          <LinkedText text={body} />
        </p>
      )}
    </div>
  );
}

// A trailing full stop or bracket is read as the sentence's, not the link's.
const URL_PATTERN = /(https?:\/\/[^\s<>"']*[^\s<>"'.,;:!?)\]])/g;

/**
 * Text with every http(s) address in it made into a link.
 */
function LinkedText({ text }: { text: string }) {
  // split() with a capturing group keeps the matches, at the odd indexes.
  return text.split(URL_PATTERN).map((part, index) =>
    index % 2 === 1 ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noreferrer noopener"
        className="break-all font-semibold underline underline-offset-4 hover:text-[var(--color-iron-fixture)]"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}
