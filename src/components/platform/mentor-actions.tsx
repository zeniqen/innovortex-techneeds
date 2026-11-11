"use client";

import { useState } from "react";
import { IconTrash } from "@tabler/icons-react";

import { ActionForm, RemoveButton, type FieldSpec } from "./action-form";
import { CredentialCard } from "./credential-card";

/**
 * The mentor panel's writes.
 */

/**
 * Adds a mentee to a program.
 *
 * The enrollment number and the initial password are generated here and
 * shown once, because neither is stored in the clear.
 */
export function AddMenteeForm({ programId }: { programId: string }) {
  const [created, setCreated] = useState<{
    enrollmentNumber?: string;
    password?: string;
  } | null>(null);

  const fields: FieldSpec[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
      placeholder: "Their name",
      width: "half",
    },
    {
      name: "interests",
      label: "Interests",
      type: "text",
      placeholder: "React, Python",
      hint: "Separate them with commas. Used for recommendations.",
      width: "half",
    },
  ];

  return (
    <div className="space-y-4">
      <ActionForm
        action="/api/platform/mentor/mentees"
        fields={fields}
        submitLabel="Add mentee"
        onDone={(result) => {
          const payload = result as
            | { enrollmentNumber?: string; password?: string }
            | null;
          if (payload?.password) {
            setCreated({
              enrollmentNumber: payload.enrollmentNumber,
              password: payload.password,
            });
          }
        }}
      >
        <input type="hidden" name="programId" value={programId} />
      </ActionForm>

      {created && (
        <CredentialCard
          enrollmentNumber={created.enrollmentNumber}
          password={created.password}
          onDismiss={() => setCreated(null)}
        />
      )}
    </div>
  );
}

/**
 * Takes a mentee off a program.
 */
export function RemoveMenteeButton({
  programId,
  menteeId,
  name,
}: {
  programId: string;
  menteeId: string;
  name: string;
}) {
  return (
    <RemoveButton
      action={`/api/platform/mentor/mentees/${menteeId}?programId=${programId}`}
      label="Remove"
      title={`Take ${name} off this program`}
      icon={<IconTrash className="h-3.5 w-3.5" />}
    />
  );
}

/**
 * Publishes a resource.
 */
export function PublishResourceForm({ programId }: { programId: string }) {
  const fields: FieldSpec[] = [
    {
      name: "title",
      label: "Title",
      type: "text",
      required: true,
      placeholder: "e.g. Intro to React hooks",
      width: "full",
    },
    {
      name: "type",
      label: "Kind of work",
      type: "select",
      required: true,
      options: [
        { value: "video", label: "Video" },
        { value: "quiz", label: "Quiz" },
        { value: "project", label: "Project" },
      ],
      width: "half",
    },
    {
      name: "maxScore",
      label: "Maximum score",
      type: "number",
      required: true,
      defaultValue: 10,
      width: "half",
    },
    {
      name: "url",
      label: "Link",
      type: "url",
      placeholder: "https://",
      hint: "Where the work lives.",
      width: "full",
    },
    {
      name: "deadline",
      label: "Due",
      type: "date",
      width: "half",
    },
    {
      name: "tags",
      label: "Tags",
      type: "text",
      placeholder: "react, hooks",
      hint: "Separate them with commas.",
      width: "half",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "What the mentee is expected to do.",
    },
  ];

  return (
    <ActionForm
      action="/api/platform/mentor/resources"
      fields={fields}
      submitLabel="Publish"
    >
      <input type="hidden" name="programId" value={programId} />
    </ActionForm>
  );
}

/**
 * Gives a piece of work a mark.
 */
export function GradeForm({
  resourceId,
  menteeId,
  maxScore,
}: {
  resourceId: string;
  menteeId: string;
  maxScore: number;
}) {
  const fields: FieldSpec[] = [
    {
      name: "score",
      label: `Score (out of ${maxScore})`,
      type: "number",
      required: true,
      defaultValue: 0,
      width: "half",
    },
    {
      name: "feedback",
      label: "Feedback",
      type: "text",
      placeholder: "Optional note for the mentee",
      width: "half",
    },
  ];

  return (
    <ActionForm
      action="/api/platform/mentor/grade"
      fields={fields}
      submitLabel="Save mark"
    >
      <input type="hidden" name="resourceId" value={resourceId} />
      <input type="hidden" name="menteeId" value={menteeId} />
    </ActionForm>
  );
}
