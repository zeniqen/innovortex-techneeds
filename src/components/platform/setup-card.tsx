"use client";

import { useState } from "react";
import { IconLoader2, IconRocket, IconSparkles } from "@tabler/icons-react";

/**
 * Setting the platform up.
 *
 * There is no way in until there is an admin, and the admin panel needs an
 * admin, so this is how the first one is made. It appears on the sign-in
 * page only while the platform has no admins at all.
 */
export function SetupCard() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<{
    admin: { email: string; password: string };
    mentor: { email: string; password: string };
    mentee: { enrollmentNumber: string; password: string };
    counts: Record<string, number>;
    warning?: string;
  } | null>(null);

  const setup = async (seed: boolean) => {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/platform/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        report?: typeof report;
      } | null;

      if (!response.ok || !payload?.report) {
        setError(payload?.error ?? "The platform could not be set up.");
        setBusy(false);
        return;
      }

      setReport(payload.report);
    } catch {
      setError("Could not reach the platform. Try again.");
    }

    setBusy(false);
  };

  if (report) {
    return (
      <div className="rounded-2xl border border-[var(--color-gain)]/30 bg-[var(--color-gain)]/5 p-6">
        <p className="flex items-center gap-2 text-sm font-bold">
          <IconSparkles className="h-4 w-4" />
          The platform is ready
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--color-iron-fixture)]">
          {report.warning ??
            `Copied ${report.counts.programs} programs, ${report.counts.mentors} mentors, ${report.counts.mentees} mentees and ${report.counts.resources} resources from the live platform.`}
        </p>

        <div className="mt-4 space-y-2">
          <Credential label="Admin email" value={report.admin.email} />
          <Credential label="Admin password" value={report.admin.password} />
          {report.mentor.email && (
            <Credential label="Mentor email" value={report.mentor.email} />
          )}
          {report.mentor.password && (
            <Credential label="Mentor password" value={report.mentor.password} />
          )}
          {report.mentee.enrollmentNumber && (
            <Credential
              label="Mentee enrollment number"
              value={report.mentee.enrollmentNumber}
            />
          )}
          {report.mentee.password && (
            <Credential label="Mentee password" value={report.mentee.password} />
          )}
        </div>

        <p className="mt-4 text-xs text-[var(--color-iron-fixture)]">
          The seeded accounts all share one password. Anything you create
          from here on gets a password of its own.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--color-spotted-dove)] bg-[var(--color-emptiness)] p-6">
      <p className="flex items-center gap-2 text-sm font-bold">
        <IconRocket className="h-4 w-4" />
        This platform has not been set up yet
      </p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--color-iron-fixture)]">
        Setting it up creates the first admin and copies the live
        TechNeeds platform in: its programs, mentors, mentees and
        resources. It takes about twenty seconds.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-3 text-xs font-semibold text-[var(--color-loss)]"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={() => setup(true)}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--color-caviar)] px-4 py-2.5 text-xs font-bold text-[var(--color-emptiness)] transition-colors hover:bg-[var(--color-iron-fixture)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? (
          <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <IconSparkles className="h-3.5 w-3.5" />
        )}
        {busy ? "Setting up..." : "Set the platform up"}
      </button>
    </div>
  );
}

function Credential({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-spotted-dove)] px-3.5 py-2">
      <span className="text-[0.68rem] font-semibold uppercase tracking-wide text-[var(--color-iron-fixture)]">
        {label}
      </span>
      <span className="truncate font-mono text-xs">{value}</span>
    </div>
  );
}
