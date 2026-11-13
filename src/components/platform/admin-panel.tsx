import Link from "next/link";
import { IconPlus, IconShieldPlus, IconUserPlus } from "@tabler/icons-react";

import { ActionBar, ModalButton } from "@/components/platform/modal";
import { ScrollIntoView } from "@/components/platform/scroll-into-view";
import {
  AddAdminForm,
  AssignProgramForm,
  AttachMentorForm,
  CreateProgramForm,
  DeleteMentorButton,
  EditProgramForm,
  DeleteProgramButton,
  OnboardMentorForm,
  RemoveMentorButton,
  RemoveProgramButton,
} from "@/components/platform/admin-actions";
import {
  Chip,
  EmptyState,
  ListRow,
  PanelCard,
  PanelShell,
  StatCard,
} from "@/components/platform/primitives";
import { formatDateTime } from "@/lib/platform/dates";
import {
  counts as platformCounts,
  listMentors,
  listMentorsForProgram,
  listPrograms,
  listResources,
} from "@/lib/platform/store";
import {
  recentAudit,
} from "@/lib/platform/admin-store";
import type { SessionUser } from "@/lib/platform/types";

/**
 * The admin panel.
 *
 * An admin creates the programs, onboards the mentors, and puts mentors
 * on the programs they run.
 */
export async function AdminPanel({
  user,
  programId,
  mentorId,
}: {
  user: SessionUser;
  programId?: string;
  mentorId?: string;
}) {

    const programs = await listPrograms();
    const mentors = await listMentors();
    const selected = programs.find((program) => program.id === programId) ?? null;
    const selectedMentor =
      mentors.find((mentor) => mentor.id === mentorId) ?? null;

    // The counts come from the store rather than from a query of this
    // project's own database, because in the tn mode the data is in the
    // backend and this project has no database of its own.
    const counts = await platformCounts();

    const activity = await recentAudit(12);

    const selectedMentors = selected ? await listMentorsForProgram(selected.id) : [];
    const selectedResources = selected ? await listResources(selected.id) : [];
    const availableMentors = mentors.filter(
      (mentor) => !selectedMentors.some((assigned) => assigned.id === mentor.id),
    );

    // The programs this mentor is on, and the ones they are not.
    const mentorPrograms = selectedMentor
      ? programs.filter((program) => selectedMentor.programIds.includes(program.id))
      : [];
    const otherPrograms = selectedMentor
      ? programs.filter((program) => !selectedMentor.programIds.includes(program.id))
      : [];

    return (
      <PanelShell
        role="admin"
        name={user.name}
        identifier={user.identifier}
        eyebrow="Admin panel"
        title="Programs and people"
        description="Create the programs the mentors run, onboard mentors, and put them on the programs they look after."
      >
        {/* Adding things is what an admin comes here to do, so the forms
            are one click away at the top and open over the page. */}
        <ActionBar>
          <ModalButton
            label="Onboard a mentor"
            icon={<IconUserPlus className="h-3.5 w-3.5" />}
            title="Onboard a mentor"
            description="Mentors sign in with their email address."
          >
            <OnboardMentorForm />
          </ModalButton>
          <ModalButton
            label="Create a program"
            icon={<IconPlus className="h-3.5 w-3.5" />}
            title="Create a program"
            description="A program is a cohort of mentees looked after by one or more mentors."
            tone="secondary"
          >
            <CreateProgramForm />
          </ModalButton>
          <ModalButton
            label="Add an admin"
            icon={<IconShieldPlus className="h-3.5 w-3.5" />}
            title="Add an admin"
            description="Admins manage the programs and the mentors."
            tone="secondary"
          >
            <AddAdminForm />
          </ModalButton>
        </ActionBar>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard accent="violet" value={counts?.programs ?? 0} label="Programs" />
          <StatCard accent="amber" value={counts?.mentors ?? 0} label="Mentors" />
          <StatCard accent="green" value={counts?.mentees ?? 0} label="Mentees" />
          <StatCard accent="bronze" value={counts?.resources ?? 0} label="Resources" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <PanelCard
              title="Programs"
              description="Every program on the platform. Open one to manage the mentors on it."
            >
              {programs.length === 0 ? (
                <EmptyState
                  title="No programs yet"
                  description="Create the first one below."
                />
              ) : (
                <ul>
                  {programs.map((program) => (
                    <ListRow
                      key={program.id}
                      title={
                        <Link
                          // The program's card opens further down the page;
                          // ScrollIntoView glides to it, so the link itself
                          // leaves the scroll position alone.
                          href={`/techboard?program=${program.id}`}
                          scroll={false}
                          className="underline-offset-4 hover:underline"
                        >
                          {program.name}
                        </Link>
                      }
                      meta={`${program.track} · ${program.description || "No description"}`}
                      detail={
                        <Chip tone={program.status === "active" ? "good" : "neutral"}>
                          {program.status}
                        </Chip>
                      }
                      action={
                        <DeleteProgramButton
                          programId={program.id}
                          name={program.name}
                        />
                      }
                    />
                  ))}
                </ul>
              )}
            </PanelCard>

            {selected && (
              <PanelCard
                id="selected-program"
                title={`Mentors on ${selected.name}`}
                description={`${selectedMentors.length} on this program, ${selectedResources.length} resources published.`}
                action={
                  <Link
                    href="/techboard"
                    className="text-xs font-bold text-[var(--color-iron-fixture)] underline underline-offset-4 hover:text-[var(--color-caviar)]"
                  >
                    Close
                  </Link>
                }
              >
                <ScrollIntoView id="selected-program" when={selected.id} />
                {selectedMentors.length === 0 ? (
                  <EmptyState
                    title="Nobody is on this program yet"
                    description="Put a mentor on it below."
                  />
                ) : (
                  <ul>
                    {selectedMentors.map((mentor) => (
                      <ListRow
                        key={mentor.id}
                        title={mentor.name}
                        meta={`${mentor.email} · ${mentor.title}`}
                        action={
                          <RemoveMentorButton
                            programId={selected.id}
                            mentorId={mentor.id}
                            name={mentor.name}
                          />
                        }
                      />
                    ))}
                  </ul>
                )}

                <div className="mt-6 border-t border-[var(--color-night-white)] pt-6">
                  <h3 className="mb-3 text-sm font-bold">Put a mentor on it</h3>
                  <AttachMentorForm
                    programId={selected.id}
                    mentors={availableMentors}
                  />
                </div>

                <div className="mt-6 border-t border-[var(--color-night-white)] pt-6">
                  <h3 className="mb-3 text-sm font-bold">Change the program</h3>
                  <EditProgramForm program={selected} />
                </div>
              </PanelCard>
            )}

            {selectedMentor && (
              <PanelCard
                id="selected-mentor"
                title={`Programs for ${selectedMentor.name}`}
                description={`${mentorPrograms.length} of ${programs.length} programs. A mentor can run more than one.`}
                action={
                  <Link
                    href="/techboard"
                    className="text-xs font-bold text-[var(--color-iron-fixture)] underline underline-offset-4 hover:text-[var(--color-caviar)]"
                  >
                    Close
                  </Link>
                }
              >
                <ScrollIntoView id="selected-mentor" when={selectedMentor.id} />
                {mentorPrograms.length === 0 ? (
                  <EmptyState
                    title="Not on any program yet"
                    description="Assign them one below."
                  />
                ) : (
                  <ul>
                    {mentorPrograms.map((program) => (
                      <ListRow
                        key={program.id}
                        title={program.name}
                        meta={program.track}
                        action={
                          <RemoveProgramButton
                            mentorId={selectedMentor.id}
                            programId={program.id}
                            programName={program.name}
                          />
                        }
                      />
                    ))}
                  </ul>
                )}

                <div className="mt-6 border-t border-[var(--color-night-white)] pt-6">
                  <h3 className="mb-3 text-sm font-bold">Assign them a program</h3>
                  <AssignProgramForm
                    mentorId={selectedMentor.id}
                    programs={otherPrograms}
                  />
                </div>
              </PanelCard>
            )}

          </div>

          <div className="space-y-6">
            <PanelCard
              title="Mentors"
              description={`${mentors.length} on the platform.`}
            >
              {mentors.length === 0 ? (
                <EmptyState title="No mentors yet" />
              ) : (
                <div className="relative">
                  <ul className="max-h-80 overflow-y-auto pr-1">
                    {mentors.map((mentor) => (
                      <ListRow
                        key={mentor.id}
                        title={
                          <Link
                            // The mentor's card opens further down the page;
                            // ScrollIntoView glides to it, so the link itself
                            // leaves the scroll position alone.
                            href={`/techboard?mentor=${mentor.id}`}
                            scroll={false}
                            className="underline-offset-4 hover:underline"
                          >
                            {mentor.name}
                          </Link>
                        }
                        meta={mentor.email}
                        detail={
                          <span className="text-[0.7rem] text-[var(--color-iron-fixture)]">
                            {mentor.programIds.length} program
                            {mentor.programIds.length === 1 ? "" : "s"}
                          </span>
                        }
                        action={
                          <DeleteMentorButton
                            mentorId={mentor.id}
                            name={mentor.name}
                          />
                        }
                      />
                    ))}
                  </ul>
                  {/* The list is taller than the card, so the cut is faded
                      rather than left as a half row. */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--color-emptiness)] to-transparent" />
                </div>
              )}
            </PanelCard>

            <PanelCard title="Recent activity" description="What has changed.">
              {activity.length === 0 ? (
                <EmptyState title="Nothing yet" />
              ) : (
                <ul className="space-y-2 text-xs">
                  {activity.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-baseline justify-between gap-3"
                    >
                      <span className="font-semibold">{entry.action}</span>
                      <span className="shrink-0 text-[var(--color-iron-fixture)]">
                        {formatDateTime(entry.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </PanelCard>
          </div>
        </div>
      </PanelShell>
    );

}
