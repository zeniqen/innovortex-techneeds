"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { IconAlertCircle, IconLoader2, IconTrash } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
/**
 * The form every panel writes through.
 *
 * A panel is a list of things you can add, change or remove. Rather than a
 * component per field, there is one form that takes a description of its
 * fields, posts them as JSON, and refreshes the page when the write lands.
 */

export type FieldSpec =
  | {
      name: string;
      label: string;
      type: "text" | "email" | "number" | "date" | "url" | "password";
      placeholder?: string;
      required?: boolean;
      defaultValue?: string | number;
      hint?: string;
      /** The bounds of a number field. */
      min?: number;
      max?: number;
      /** How wide the field is, as a span of the grid. */
      width?: "full" | "half";
    }
  | {
      name: string;
      label: string;
      type: "textarea";
      placeholder?: string;
      required?: boolean;
      defaultValue?: string;
      hint?: string;
      width?: "full" | "half";
    }
  | {
      name: string;
      label: string;
      type: "select";
      options: { value: string; label: string }[];
      required?: boolean;
      defaultValue?: string;
      hint?: string;
      width?: "full" | "half";
    };

export function ActionForm({
  action,
  method = "POST",
  fields,
  submitLabel = "Save",
  tone = "primary",
  onDone,
  children,
  className,
}: {
  action: string;
  method?: "POST" | "PATCH" | "DELETE";
  fields: FieldSpec[];
  submitLabel?: string;
  tone?: "primary" | "danger";
  /** Called with the parsed response once the write lands. */
  onDone?: (result: unknown) => void;
  /** Extra controls shown below the fields. */
  children?: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const body: Record<string, string> = {};

    // Everything in the form is sent, not only the declared fields. The
    // forms carry hidden inputs - the program a resource belongs to, the
    // piece of work being marked - and those are children rather than
    // fields, so reading only the fields would quietly drop them.
    for (const [name, value] of data.entries()) {
      if (typeof value === "string" && value !== "") {
        body[name] = value;
      }
    }

    try {
      const response = await fetch(action, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          typeof payload === "object" && payload !== null && "error" in payload
            ? String((payload as { error: unknown }).error)
            : "That did not work. Try again.",
        );
        setBusy(false);
        return;
      }

      form.reset();
      onDone?.(payload);
      router.refresh();
      setBusy(false);
    } catch {
      setError("Could not reach the platform. Try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className={cn("space-y-4", className)}>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <Field key={field.name} field={field} />
        ))}
      </div>

      {children}

      {error && (
        <p
          role="alert"
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-loss)]"
        >
          <IconAlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold tn-press disabled:cursor-not-allowed disabled:opacity-60",
          tone === "danger"
            ? "bg-[var(--color-loss)] text-white hover:bg-[var(--color-loss)]/90"
            : "bg-[var(--color-caviar)] text-[var(--color-emptiness)] hover:bg-[var(--color-iron-fixture)]",
        )}
      >
        {busy && <IconLoader2 className="h-3.5 w-3.5 animate-spin" />}
        {busy ? "Working..." : submitLabel}
      </button>
    </form>
  );
}

/**
 * A button that removes something, with a second press to be sure.
 *
 * Removing is a single call with nothing in the body, so it does not need
 * the whole form machinery. A stray click should not take a mentee off a
 * program, so the first press arms the button and the second one does
 * it; Cancel puts it back.
 */
export function RemoveButton({
  action,
  label,
  question,
  title,
  icon,
}: {
  action: string;
  label: string;
  /** What the armed button says, e.g. "Remove Asha?". */
  question: string;
  title?: string;
  icon?: ReactNode;
}) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);

    try {
      const response = await fetch(action, { method: "DELETE" });
      if (!response.ok) throw new Error(String(response.status));
      router.refresh();
    } catch {
      // The list is unchanged; say so, so the person knows to try again.
      setFailed(true);
    }

    setBusy(false);
    setAsking(false);
  };

  const error = failed && (
    <span role="alert" className="text-[0.7rem] font-semibold text-[var(--color-loss)]">
      Couldn&apos;t remove that. Try again.
    </span>
  );

  if (!asking) {
    return (
      <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
        {error}
        <button
          type="button"
          onClick={() => {
            setFailed(false);
            setAsking(true);
          }}
          title={title}
          aria-label={title ?? label}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-spotted-dove)] px-2.5 py-1.5 text-[0.7rem] font-bold text-[var(--color-iron-fixture)] transition-colors duration-150 hover:border-[var(--color-loss)] hover:text-[var(--color-loss)]"
        >
          {icon}
          {label}
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
      <button
        type="button"
        disabled={busy}
        onClick={submit}
        title={title}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-loss)] px-2.5 py-1.5 text-[0.7rem] font-bold text-white transition-colors duration-150 hover:bg-[var(--color-loss)]/90 disabled:opacity-60"
      >
        {busy ? (
          <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <IconTrash className="h-3.5 w-3.5" />
        )}
        {question}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => setAsking(false)}
        className="rounded-lg border border-[var(--color-spotted-dove)] px-2.5 py-1.5 text-[0.7rem] font-bold text-[var(--color-iron-fixture)] transition-colors duration-150 hover:bg-[var(--color-night-white)] disabled:opacity-60"
      >
        Cancel
      </button>
    </span>
  );
}

/**
 * A button that removes something, and asks first.
 *
 * Deleting a program takes the mentees on it with it, so it is worth a
 * second press. The first press arms the button and the second one does
 * it; anything else cancels it.
 */
export function DangerButton({
  action,
  label,
  question,
  title,
}: {
  action: string;
  /** What the button says before it is armed. */
  label: string;
  /** What it asks when it is armed. */
  question: string;
  title?: string;
}) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(action, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(payload?.error ?? "That could not be removed.");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach the platform.");
    }

    setBusy(false);
    setAsking(false);
  };

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        title={title}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-spotted-dove)] px-2.5 py-1.5 text-[0.7rem] font-bold text-[var(--color-iron-fixture)] transition-colors duration-150 hover:border-[var(--color-loss)] hover:text-[var(--color-loss)]"
      >
        {label}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        disabled={busy}
        onClick={remove}
        title={title}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-loss)] px-2.5 py-1.5 text-[0.7rem] font-bold text-white transition-colors duration-150 hover:bg-[var(--color-loss)]/90 disabled:opacity-60"
      >
        {busy ? (
          <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <IconTrash className="h-3.5 w-3.5" />
        )}
        {question}
      </button>
      <button
        type="button"
        onClick={() => setAsking(false)}
        className="rounded-lg border border-[var(--color-spotted-dove)] px-2.5 py-1.5 text-[0.7rem] font-bold text-[var(--color-iron-fixture)] transition-colors duration-150 hover:bg-[var(--color-night-white)]"
      >
        Cancel
      </button>
      {error && (
        <span role="alert" className="text-[0.7rem] font-semibold text-[var(--color-loss)]">
          {error}
        </span>
      )}
    </span>
  );
}

function Field({ field }: { field: FieldSpec }) {
  const id = `field-${field.name}`;
  const width = field.width === "half" ? "sm:col-span-1" : "sm:col-span-2";
  const common =
    "w-full rounded-xl border border-[var(--color-spotted-dove)] bg-[var(--color-emptiness)] px-3.5 py-2.5 text-sm text-[var(--color-caviar)] transition-colors placeholder:text-[var(--color-stone-haze)] focus:border-[var(--color-caviar)] focus:outline-none focus:ring-2 focus:ring-[var(--color-caviar)]/15";

  return (
    <div className={width}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold text-[var(--color-caviar)]"
      >
        {field.label}
        {field.required && (
          <span className="ml-0.5 text-[var(--color-loss)]">*</span>
        )}
      </label>

      {field.type === "textarea" ? (
        <textarea
          id={id}
          name={field.name}
          rows={3}
          required={field.required}
          placeholder={field.placeholder}
          defaultValue={field.defaultValue}
          className={common}
        />
      ) : field.type === "select" ? (
        <select
          id={id}
          name={field.name}
          required={field.required}
          defaultValue={field.defaultValue}
          className={common}
        >
          <option value="">Choose…</option>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={field.name}
          type={field.type}
          required={field.required}
          placeholder={field.placeholder}
          defaultValue={field.defaultValue}
          min={field.min}
          max={field.max}
          className={common}
        />
      )}

      {field.hint && (
        <p className="mt-1 text-[0.7rem] leading-relaxed text-[var(--color-iron-fixture)]">
          {field.hint}
        </p>
      )}
    </div>
  );
}
