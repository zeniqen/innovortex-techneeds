"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { IconAlertCircle, IconLoader2 } from "@tabler/icons-react";

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

    for (const field of fields) {
      const value = data.get(field.name);
      if (typeof value === "string" && value !== "") {
        body[field.name] = value;
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
          "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60",
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
 * A button that removes something.
 *
 * Removing is a single call with nothing in the body, so it does not need
 * the whole form machinery.
 */
export function RemoveButton({
  action,
  label,
  title,
  icon,
}: {
  action: string;
  label: string;
  title?: string;
  icon?: ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setBusy(true);

    try {
      await fetch(action, { method: "DELETE" });
      router.refresh();
    } catch {
      // The list is unchanged either way; the person can try again.
    }

    setBusy(false);
  };

  return (
    <button
      type="button"
      onClick={submit}
      disabled={busy}
      title={title}
      aria-label={title ?? label}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-spotted-dove)] px-2.5 py-1.5 text-[0.7rem] font-bold text-[var(--color-iron-fixture)] transition-colors duration-150 hover:border-[var(--color-loss)] hover:text-[var(--color-loss)] disabled:opacity-60"
    >
      {busy ? <IconLoader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {label}
    </button>
  );
}

function Field({ field }: { field: FieldSpec }) {  const id = `field-${field.name}`;
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
