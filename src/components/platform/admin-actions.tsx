"use client";

import { useState } from "react";
import { IconTrash } from "@tabler/icons-react";

import { ActionForm, DangerButton, RemoveButton, type FieldSpec } from "./action-form";
import { CredentialCard } from "./credential-card";
import type { Mentor } from "@/lib/platform/types";

/**
 * A program, as far as the assignment controls need to know about it.
 */
export type ProgramOption = { id: string; name: string };

/**
 * The admin panel's writes.
 *
 * Each of these is a form that posts to the API and refreshes the page.
 */

/**
 * Creates a program.
 */
export function CreateProgramForm() {
  const fields: FieldSpec[] = [
    {
      name: "name",
      label: "Program name",
      type: "text",
      required: true,
      placeholder: "e.g. Web Development Bootcamp",
      width: "half",
    },
    {
      name: "track",
      label: "Subject area",
      type: "text",
      placeholder: "e.g. web development",
      hint: "Used to match mentees against the work they have done.",
      width: "half",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "What this program covers.",
    },
  ];

  return (
    <ActionForm
      action="/api/platform/admin/programs"
      fields={fields}
      submitLabel="Create program"
    />
  );
}

/**
 * Puts a mentor on a program.
 *
 * The mentor can be one who is already on the platform, or somebody new
 * who is onboarded at the same time.
 */
export function AttachMentorForm({
  programId,
  mentors,
}: {
  programId: string;
  mentors: Mentor[];
}) {
  const [created, setCreated] = useState<{ password?: string } | null>(null);

  const existing: FieldSpec[] = mentors.length
    ? [
        {
          name: "mentorId",
          label: "A mentor who is already on the platform",
          type: "select",
          options: mentors.map((mentor) => ({
            value: mentor.id,
            label: `${mentor.name} — ${mentor.email}`,
          })),
          width: "full",
        },
      ]
    : [];

  const fresh: FieldSpec[] = [
    {
      name: "name",
      label: "Or onboard somebody new",
      type: "text",
      placeholder: "Their name",
      width: "half",
    },
    {
      name: "email",
      label: "Their email",
      type: "email",
      required: true,
      placeholder: "them@example.com",
      width: "half",
    },
  ];

  return (
    <div className="space-y-4">
      <ActionForm
        action={`/api/platform/admin/programs/${programId}/mentors`}
        fields={[...existing, ...fresh]}
        submitLabel="Put on this program"
        onDone={(result) => {
          const payload = result as { password?: string } | null;
          if (payload?.password) setCreated({ password: payload.password });
        }}
      />

      {created && (
        <CredentialCard
          mentorEmail="See the mentor list below"
          password={created.password}
          onDismiss={() => setCreated(null)}
        />
      )}
    </div>
  );
}

/**
 * Takes a mentor off a program.
 */
export function RemoveMentorButton({
  programId,
  mentorId,
  name,
}: {
  programId: string;
  mentorId: string;
  name: string;
}) {
  return (
    <RemoveButton
      action={`/api/platform/admin/programs/${programId}/mentors/${mentorId}`}
      label="Remove"
      title={`Take ${name} off this program`}
      icon={<IconTrash className="h-3.5 w-3.5" />}
    />
  );
}

/**
 * Onboards a mentor who is not on a program yet.
 */
export function OnboardMentorForm() {
  const [created, setCreated] = useState<{
    password?: string;
    email?: string;
  } | null>(null);

  const fields: FieldSpec[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
      width: "half",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      width: "half",
    },
    {
      name: "title",
      label: "Title",
      type: "text",
      placeholder: "e.g. Senior Engineer",
      width: "half",
    },
    {
      name: "skills",
      label: "Skills",
      type: "text",
      placeholder: "React, Node, Design",
      hint: "Separate them with commas.",
      width: "half",
    },
  ];

  return (
    <div className="space-y-4">
      <ActionForm
        action="/api/platform/admin/mentors"
        fields={fields}
        submitLabel="Onboard mentor"
        onDone={(result) => {
          const payload = result as
            | { password?: string; mentor?: { email?: string } }
            | null;
          if (payload?.password) {
            setCreated({ password: payload.password, email: payload.mentor?.email });
          }
        }}
      />

      {created && (
        <CredentialCard
          mentorEmail={created.email}
          password={created.password}
          onDismiss={() => setCreated(null)}
        />
      )}
    </div>
  );
}

/**
 * Adds another admin.
 */
export function AddAdminForm() {
  const [created, setCreated] = useState<{
    password?: string;
    email?: string;
  } | null>(null);

  const fields: FieldSpec[] = [
    { name: "name", label: "Name", type: "text", width: "half" },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      width: "half",
    },
  ];

  return (
    <div className="space-y-4">
      <ActionForm
        action="/api/platform/admin/admins"
        fields={fields}
        submitLabel="Add admin"
        onDone={(result) => {
          const payload = result as
            | { password?: string; admin?: { email?: string } }
            | null;
          if (payload?.password) {
            setCreated({ password: payload.password, email: payload.admin?.email });
          }
        }}
      />

      {created && (
        <CredentialCard
          mentorEmail={created.email}
          password={created.password}
          onDismiss={() => setCreated(null)}
        />
      )}
    </div>
  );
}

/**
 * Puts a mentor on a program.
 *
 * The other way round from putting a mentor on a program, and the same
 * thing underneath: an admin thinks about it both ways.
 */
export function AssignProgramForm({
  mentorId,
  programs,
}: {
  mentorId: string;
  programs: ProgramOption[];
}) {
  if (programs.length === 0) {
    return (
      <p className="text-xs text-[var(--color-iron-fixture)]">
        This mentor is on every program already.
      </p>
    );
  }

  const fields: FieldSpec[] = [
    {
      name: "programId",
      label: "Program",
      type: "select",
      required: true,
      options: programs.map((program) => ({
        value: program.id,
        label: program.name,
      })),
    },
  ];

  return (
    <ActionForm
      action={`/api/platform/admin/mentors/${mentorId}/programs`}
      fields={fields}
      submitLabel="Assign program"
    />
  );
}

/**
 * Takes a mentor off a program.
 */
export function RemoveProgramButton({
  mentorId,
  programId,
  programName,
}: {
  mentorId: string;
  programId: string;
  programName: string;
}) {
  return (
    <RemoveButton
      action={`/api/platform/admin/mentors/${mentorId}/programs/${programId}`}
      label="Remove"
      title={`Take ${programName} off this mentor`}
      icon={<IconTrash className="h-3.5 w-3.5" />}
    />
  );
}

/**
 * Removes a mentor from the platform.
 */
export function DeleteMentorButton({
  mentorId,
  name,
}: {
  mentorId: string;
  name: string;
}) {
  return (
    <DangerButton
      action={`/api/platform/admin/mentors/${mentorId}`}
      label="Delete"
      question={`Delete ${name}?`}
      title={`Remove ${name} from the platform`}
    />
  );
}

/**
 * Removes a program and everything on it.
 */
export function DeleteProgramButton({
  programId,
  name,
}: {
  programId: string;
  name: string;
}) {
  return (
    <DangerButton
      action={`/api/platform/admin/programs/${programId}`}
      label="Delete program"
      question={`Delete ${name}?`}
      title={`Remove ${name} and everything on it`}
    />
  );
}
