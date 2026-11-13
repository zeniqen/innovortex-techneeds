"use client";

import { useState } from "react";
import { IconCheck, IconCopy, IconKey } from "@tabler/icons-react";

import { useHoldModal } from "./modal";

/**
 * A generated credential, shown once.
 *
 * A mentor adds a mentee and gets an enrollment number and a password
 * back. Neither is ever stored in the clear, so this panel is the only
 * chance to copy them. The copy buttons are there because these get
 * typed into a chat message by hand.
 */
export function CredentialCard({
  enrollmentNumber,
  password,
  mentorEmail,
  onDismiss,
}: {
  enrollmentNumber?: string;
  password?: string;
  mentorEmail?: string;
  onDismiss?: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const showing = Boolean(enrollmentNumber || password || mentorEmail);

  // The modal this sits in stays open until the person says they have
  // saved these: an Escape or a stray click must not lose them.
  const holding = showing && Boolean(onDismiss);
  useHoldModal(holding);

  if (!showing) return null;

  const copy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied((current) => (current === key ? null : current)), 1600);
    } catch {
      // Clipboard access can be refused. The value is on screen, so the
      // person can still read it out.
    }
  };

  return (
    <div
      data-hold-modal={holding ? "" : undefined}
      className="tn-enter-pop rounded-2xl border border-[var(--color-gain)]/30 bg-[var(--color-gain)]/5 p-5"
    >
      <p className="flex items-center gap-2 text-sm font-bold text-[var(--color-caviar)]">
        <IconKey className="h-4 w-4" />
        Copy these now
      </p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--color-iron-fixture)]">
        They are shown once and never stored in the clear. There is no way
        to read them again, only to reset them.
      </p>

      <div className="mt-4 space-y-3">
        {enrollmentNumber && (
          <Credential
            label="Enrollment number"
            value={enrollmentNumber}
            copied={copied === "enrollment"}
            onCopy={() => copy(enrollmentNumber, "enrollment")}
          />
        )}
        {mentorEmail && (
          <Credential
            label="Sign-in email"
            value={mentorEmail}
            copied={copied === "email"}
            onCopy={() => copy(mentorEmail, "email")}
          />
        )}
        {password && (
          <Credential
            label="Initial password"
            value={password}
            copied={copied === "password"}
            onCopy={() => copy(password, "password")}
          />
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-caviar)] px-4 py-2.5 text-xs font-bold text-[var(--color-emptiness)] tn-press hover:bg-[var(--color-iron-fixture)]"
        >
          <IconCheck className="h-3.5 w-3.5" />
          I&apos;ve saved these
        </button>
      )}
    </div>
  );
}

function Credential({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-spotted-dove)] bg-[var(--color-emptiness)] px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-[var(--color-iron-fixture)]">
          {label}
        </p>
        {/* Never cut short: a credential missing its end is no credential. */}
        <p className="mt-0.5 break-all font-mono text-sm">{value}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        aria-label={`Copy the ${label.toLowerCase()}`}
        className="shrink-0 rounded-lg border border-[var(--color-spotted-dove)] p-2 text-[var(--color-iron-fixture)] transition-colors hover:bg-[var(--color-night-white)]"
      >
        {copied ? (
          <IconCheck className="h-4 w-4 text-[var(--color-gain)]" />
        ) : (
          <IconCopy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
