"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  IconAlertCircle,
  IconLoader2,
  IconSchool,
  IconUsersGroup,
  IconShieldCheck,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import type { Role } from "@/lib/platform/types";

/**
 * Signing in to the platform.
 *
 * A mentee signs in with the enrollment number their mentor gave them. A
 * mentor or an admin signs in with an email address.
 */

const TABS: { role: Role; label: string; Icon: typeof IconSchool }[] = [
  { role: "mentee", label: "Mentee", Icon: IconSchool },
  { role: "mentor", label: "Mentor", Icon: IconUsersGroup },
  { role: "admin", label: "Admin", Icon: IconShieldCheck },
];

export function SignInForm({
  defaultRole = "mentee",
}: {
  defaultRole?: Role;
}) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(defaultRole);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/platform/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, identifier, password }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        user?: { role: Role };
      } | null;

      if (!response.ok || !payload?.user) {
        setError(payload?.error ?? "Those details did not work.");
        setBusy(false);
        return;
      }

      const next =
        payload.user.role === "admin"
          ? "/admin"
          : payload.user.role === "mentor"
            ? "/mentor"
            : "/mentee";

      router.push(next);
      router.refresh();
    } catch {
      setError("Could not reach the platform. Try again.");
      setBusy(false);
    }
  };

  const identifierLabel = role === "mentee" ? "Enrollment number" : "Email";

  return (
    <div className="rounded-2xl border border-[var(--color-spotted-dove)] bg-[var(--color-emptiness)] p-6 shadow-sm sm:p-8">
      <div className="flex gap-1 rounded-xl bg-[var(--color-night-white)] p-1">
        {TABS.map((tab) => (
          <button
            key={tab.role}
            type="button"
            onClick={() => {
              setRole(tab.role);
              setError(null);
            }}
            aria-pressed={role === tab.role}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors duration-150",
              role === tab.role
                ? "bg-[var(--color-emptiness)] text-[var(--color-caviar)] shadow-sm"
                : "text-[var(--color-iron-fixture)] hover:text-[var(--color-caviar)]",
            )}
          >
            <tab.Icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="identifier"
            className="mb-1.5 block text-xs font-semibold"
          >
            {identifierLabel}
          </label>
          <input
            id="identifier"
            name="identifier"
            type={role === "mentee" ? "text" : "email"}
            autoComplete={role === "mentee" ? "username" : "email"}
            required
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder={
              role === "mentee" ? "e.g. 7KQ4M2PD" : "you@example.com"
            }
            className="w-full rounded-xl border border-[var(--color-spotted-dove)] bg-[var(--color-emptiness)] px-4 py-3 text-sm transition-colors placeholder:text-[var(--color-stone-haze)] focus:border-[var(--color-caviar)] focus:outline-none focus:ring-2 focus:ring-[var(--color-caviar)]/15"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-semibold"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Your password"
            className="w-full rounded-xl border border-[var(--color-spotted-dove)] bg-[var(--color-emptiness)] px-4 py-3 text-sm transition-colors placeholder:text-[var(--color-stone-haze)] focus:border-[var(--color-caviar)] focus:outline-none focus:ring-2 focus:ring-[var(--color-caviar)]/15"
          />
        </div>

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
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-caviar)] px-5 py-3 text-sm font-bold text-[var(--color-emptiness)] shadow-md transition-colors duration-150 hover:bg-[var(--color-iron-fixture)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy && <IconLoader2 className="h-4 w-4 animate-spin" />}
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
