import Link from "next/link";
import type { ReactNode } from "react";
import {
  IconArrowUpRight,
  IconUsersGroup,
  IconSchool,
  IconShieldCheck,
  IconSparkles,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import type { Role } from "@/lib/platform/types";

/**
 * The pieces every panel is built from.
 *
 * The panels are dense with numbers and lists, so the primitives here are
 * deliberately plain: a card, a number, a label, a list row. The colour
 * comes from the site's own palette rather than from anywhere new.
 */

/**
 * What a panel shows while it is waiting for the server.
 *
 * The panels read the session cookie, so they cannot be prerendered and
 * they stream in behind a Suspense boundary. This is what is on screen
 * until they do.
 */
export function PanelSkeleton() {
  return (
    <div className="relative bg-[var(--color-emptiness)] text-[var(--color-caviar)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-5 w-28 animate-pulse rounded-full bg-[var(--color-night-white)]" />
        <div className="mt-4 h-10 w-72 animate-pulse rounded-xl bg-[var(--color-night-white)]" />
        <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-[var(--color-night-white)]" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl bg-[var(--color-night-white)]"
            />
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="h-96 animate-pulse rounded-2xl bg-[var(--color-night-white)] lg:col-span-2" />
          <div className="h-96 animate-pulse rounded-2xl bg-[var(--color-night-white)]" />
        </div>
      </div>
    </div>
  );
}

/**
 * The frame around a panel: the heading, the tabs, and who is signed in.
 */
export function PanelShell({
  role,
  name,
  identifier,
  eyebrow,
  title,
  description,
  children,
}: {
  role: Role;
  name: string;
  identifier: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="relative bg-[var(--color-emptiness)] text-[var(--color-caviar)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-6 border-b border-[var(--color-spotted-dove)] pb-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-spotted-dove)] bg-[var(--color-night-white)] px-3 py-1 text-xs font-semibold">
              <RoleIcon role={role} className="h-3.5 w-3.5 text-[var(--color-iron-fixture)]" />
              {eyebrow}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-iron-fixture)] sm:text-base">
              {description}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold">{name}</p>
              <p className="text-xs text-[var(--color-iron-fixture)]">
                {identifier}
              </p>
            </div>
            <SignOutButton />
          </div>
        </header>

        <div className="pt-8">{children}</div>
      </div>
    </div>
  );
}

/**
 * The icon that goes with a role.
 */
export function RoleIcon({
  role,
  className,
}: {
  role: Role;
  className?: string;
}) {
  if (role === "admin") return <IconShieldCheck className={className} />;
  if (role === "mentor") return <IconUsersGroup className={className} />;
  return <IconSchool className={className} />;
}

/**
 * A card.
 */
export function PanelCard({
  title,
  description,
  action,
  children,
  className,
  id,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Lets a link jump straight to this card. */
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        // The margin keeps a card that is jumped to off the very top edge.
        "scroll-mt-6 rounded-2xl border border-[var(--color-spotted-dove)] bg-[var(--color-emptiness)] p-5 sm:p-6",
        className,
      )}
    >
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && (
              <h2 className="text-base font-bold sm:text-lg">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-iron-fixture)] sm:text-sm">
                {description}
              </p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * A number with a label under it.
 */
export function StatCard({
  value,
  label,
  hint,
  tone = "neutral",
  accent,
}: {
  value: ReactNode;
  label: string;
  hint?: string;
  tone?: "neutral" | "good" | "warn";
  /** A thin line of colour along the top, from the site's accent set. */
  accent?: Accent;
}) {
  const tones = {
    neutral: "text-[var(--color-caviar)]",
    good: "text-[var(--color-gain)]",
    warn: "text-[var(--color-amber)]",
  } as const;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--color-spotted-dove)] bg-[var(--color-emptiness)] p-5">
      {accent && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: ACCENTS[accent] }}
        />
      )}
      <p className={cn("text-3xl font-extrabold tracking-tight", tones[tone])}>
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-[var(--color-caviar)]">{label}</p>
      {hint && (
        <p className="mt-0.5 text-xs text-[var(--color-iron-fixture)]">{hint}</p>
      )}
    </div>
  );
}

/**
 * A row in a list.
 */
export function ListRow({
  title,
  meta,
  detail,
  action,
}: {
  title: ReactNode;
  meta?: ReactNode;
  detail?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-night-white)] py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title}</p>
        {meta && (
          <p className="mt-0.5 text-xs text-[var(--color-iron-fixture)]">{meta}</p>
        )}
        {detail && <div className="mt-1.5">{detail}</div>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </li>
  );
}

/**
 * A small label.
 */
export function Chip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const tones = {
    neutral:
      "border-[var(--color-spotted-dove)] bg-[var(--color-night-white)] text-[var(--color-iron-fixture)]",
    good: "border-[var(--color-gain)]/30 bg-[var(--color-gain)]/10 text-[var(--color-gain)]",
    warn: "border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10 text-[var(--color-amber)]",
    bad: "border-[var(--color-loss)]/30 bg-[var(--color-loss)]/10 text-[var(--color-loss)]",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

/**
 * What a list shows when it has nothing in it.
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--color-spotted-dove)] px-5 py-8 text-center">
      <p className="text-sm font-semibold">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[var(--color-iron-fixture)]">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * A link that looks like a button.
 */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors duration-150",
        variant === "primary"
          ? "bg-[var(--color-caviar)] text-[var(--color-emptiness)] hover:bg-[var(--color-iron-fixture)]"
          : "border border-[var(--color-spotted-dove)] text-[var(--color-caviar)] hover:bg-[var(--color-night-white)]",
        className,
      )}
    >
      {children}
      <IconArrowUpRight className="h-3.5 w-3.5" />
    </Link>
  );
}

/**
 * The site's accent colours, the same set the landing page and the
 * profile charts use.
 */
export type Accent = "violet" | "amber" | "green" | "bronze";

export const ACCENTS: Record<Accent, string> = {
  violet: "var(--color-plum-bright)",
  amber: "var(--color-gold-deep)",
  green: "var(--color-gain)",
  bronze: "var(--color-bronze-deep)",
};

/**
 * A badge for a resource type.
 *
 * Each kind of work keeps the colour it has on the profile charts:
 * violet for videos, amber for quizzes, green for projects.
 */
export function ResourceTypeChip({ type }: { type: string }) {
  const label =
    type === "quiz" ? "Quiz" : type === "project" ? "Project" : "Video";
  const color =
    ACCENTS[type === "quiz" ? "amber" : type === "project" ? "green" : "violet"];
  return (
    <span
      style={{
        color,
        background: `color-mix(in srgb, ${color} 12%, var(--color-emptiness))`,
      }}
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide"
    >
      <IconSparkles className="h-3 w-3" />
      {label}
    </span>
  );
}

/**
 * Signs out.
 */
function SignOutButton() {
  return (
    <form action="/api/platform/logout" method="post">
      <button
        type="submit"
        className="rounded-xl border border-[var(--color-spotted-dove)] px-3.5 py-2 text-xs font-bold text-[var(--color-caviar)] transition-colors duration-150 hover:bg-[var(--color-night-white)]"
      >
        Sign out
      </button>
    </form>
  );
}
