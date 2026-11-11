"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  IconArrowUpRight,
  IconCircleCheck,
  IconClock,
  IconLoader2,
  IconPlayerPlay,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/platform/dates";
import { ResourceTypeChip } from "./primitives";
import type { ResourceWithProgress } from "@/lib/platform/types";

/**
 * The mentee's own work.
 *
 * One card per resource, with what it is worth, when it is due, and the
 * button that does the next thing: open it, mark it watched, or hand in
 * the work.
 */
export function ResourceCard({
  resource,
}: {
  resource: ResourceWithProgress;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const status = resource.progress?.status ?? "assigned";
  const done = status === "graded";
  const handedIn = status === "submitted";
  const started = status === "in_progress";

  const overdue = resource.overdue;

  const call = async (path: string, body?: Record<string, string>) => {
    setBusy(true);
    try {
      await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      router.refresh();
    } catch {
      // The card keeps its state; the person can press the button again.
    }
    setBusy(false);
  };

  return (
    <li
      className={cn(
        "rounded-xl border p-4 transition-colors duration-150",
        done
          ? "border-[var(--color-gain)]/30 bg-[var(--color-gain)]/5"
          : overdue
            ? "border-[var(--color-loss)]/30 bg-[var(--color-loss)]/5"
            : "border-[var(--color-night-white)]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold">{resource.title}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-iron-fixture)]">
            <span className="inline-flex items-center gap-1">
              <ResourceTypeChip type={resource.type} />
            </span>
            <span>Worth {resource.maxScore} points</span>
            {resource.deadline && (
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  overdue && "font-semibold text-[var(--color-loss)]",
                )}
              >
                <IconClock className="h-3.5 w-3.5" />
                due {formatDate(resource.deadline)}
              </span>
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {done && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-gain)]/10 px-2.5 py-1 text-[0.7rem] font-bold text-[var(--color-gain)]">
              <IconCircleCheck className="h-3.5 w-3.5" />
              {resource.progress?.score ?? 0}/{resource.maxScore}
            </span>
          )}

          {done ? (
            <span className="text-[0.7rem] font-semibold text-[var(--color-iron-fixture)]">
              {resource.progress?.feedback || "Marked"}
            </span>
          ) : resource.type === "video" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                call(`/api/platform/mentee/resources/${resource.id}/submit`)
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-caviar)] px-3 py-1.5 text-[0.7rem] font-bold text-[var(--color-emptiness)] transition-colors hover:bg-[var(--color-iron-fixture)] disabled:opacity-60"
            >
              {busy ? (
                <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
              ) : handedIn ? (
                <IconCircleCheck className="h-3.5 w-3.5" />
              ) : (
                <IconPlayerPlay className="h-3.5 w-3.5" />
              )}
              {handedIn ? "Handed in" : started ? "Mark watched" : "Start"}
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => setOpen((value) => !value)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-spotted-dove)] px-3 py-1.5 text-[0.7rem] font-bold transition-colors hover:bg-[var(--color-night-white)] disabled:opacity-60"
            >
              {handedIn ? "Change" : "Hand in"}
              <IconArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {open && resource.type !== "video" && (
        <div className="mt-4 border-t border-[var(--color-night-white)] pt-4">
          {resource.description && (
            <p className="mb-3 text-xs leading-relaxed text-[var(--color-iron-fixture)]">
              {resource.description}
            </p>
          )}
          <SubmitForm
            resourceId={resource.id}
            initial={resource.submission?.body ?? ""}
            onDone={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        </div>
      )}

      {resource.url && !open && (
        <a
          href={resource.url}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-3 inline-flex items-center gap-1 text-[0.7rem] font-semibold text-[var(--color-iron-fixture)] underline underline-offset-4 hover:text-[var(--color-caviar)]"
        >
          Open the resource
          <IconArrowUpRight className="h-3 w-3" />
        </a>
      )}
    </li>
  );
}

function SubmitForm({
  resourceId,
  initial,
  onDone,
}: {
  resourceId: string;
  initial: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [body, setBody] = useState(initial);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);

    try {
      await fetch(`/api/platform/mentee/resources/${resourceId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      onDone();
    } catch {
      setBusy(false);
      return;
    }

    router.refresh();
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-xs font-semibold">
        Your work
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={3}
          placeholder="A link to what you built, or your answers."
          className="mt-1.5 w-full rounded-xl border border-[var(--color-spotted-dove)] bg-[var(--color-emptiness)] px-3.5 py-2.5 text-sm transition-colors placeholder:text-[var(--color-stone-haze)] focus:border-[var(--color-caviar)] focus:outline-none focus:ring-2 focus:ring-[var(--color-caviar)]/15"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-caviar)] px-4 py-2 text-xs font-bold text-[var(--color-emptiness)] transition-colors hover:bg-[var(--color-iron-fixture)] disabled:opacity-60"
      >
        {busy && <IconLoader2 className="h-3.5 w-3.5 animate-spin" />}
        Hand in
      </button>
    </form>
  );
}
