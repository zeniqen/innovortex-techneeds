import Link from "next/link";
import {
  IconArrowUpRight,
  IconFlame,
  IconSparkles,
  IconTrophy,
} from "@tabler/icons-react";

import { Crest } from "./crest";
import { Particles } from "@/components/ui/particles";
import type { CSSProperties, ReactNode } from "react";

import { ACCENTS, Chip, PanelCard, StatCard, type Accent } from "./primitives";
import { ProfileCharts } from "./profile-charts";
import type { ProfileCharts as Charts } from "@/lib/platform/ai/charts";
import { cn } from "@/lib/utils";
import type { AiProfile } from "@/lib/platform/ai/profile";
import type { LeaderboardRow } from "@/lib/platform/types";

/**
 * The profile page.
 *
 * Everything on it is worked out from what the person has actually done.
 * The crest is drawn from their details, the badges say what they have
 * earned, and the recommendations say what to do next and why.
 */
export function ProfileView({
  profile,
  charts,
  role,
  leaderboard,
  isSelf,
  showLeaderboard = true,
}: {
  profile: AiProfile;
  charts: Charts;
  role: "mentee" | "mentor";
  leaderboard: LeaderboardRow[];
  /** True when this is the signed-in person's own profile. */
  isSelf: boolean;
  showLeaderboard?: boolean;
}) {
  const mentor = role === "mentor";
  // The crest seed is "id:name". The tn backend sends a leaderboard row
  // with the name in place of an id, so either can mark the person's row.
  const [selfId, ...nameParts] = profile.avatarSeed.split(":");
  const selfName = nameParts.join(":");

  return (
    <div className="relative bg-[var(--color-emptiness)] text-[var(--color-caviar)]">
      {/* The particles sit behind the profile. The canvas is the height of
          the viewport rather than the height of the page: it is cleared and
          redrawn every frame, and a canvas the height of a long page is
          four times the work for a background nobody can tell apart. */}
      {/* The canvas is sticky so it stays in view, but a sticky element
          still takes up its height in the flow - which pushed the profile
          a whole screen down. The absolute wrapper spans the page and
          takes up no room, and the canvas sticks inside it. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <Particles
          className="sticky top-0 h-screen w-full"
          quantity={70}
          size={0.5}
          staticity={60}
          ease={60}
          color="#95898B"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* --- the header ---------------------------------------------------- */}
        <header className="grid gap-8 md:grid-cols-[auto_1fr] md:items-center">
          <div className="relative mx-auto size-36 shrink-0 sm:size-44">
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <Crest seed={profile.avatarSeed} className="size-full" />
            </div>
            <LevelRing level={profile.level} />
          </div>

          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-spotted-dove)] bg-[var(--color-night-white)] px-3 py-1 text-xs font-semibold">
              <IconSparkles className="h-3.5 w-3.5 text-[var(--color-iron-fixture)]" />
              {profile.archetype.name}
            </p>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {profile.headline}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-iron-fixture)] sm:text-base">
              {profile.summary}
            </p>
            <p className="mt-4 max-w-2xl text-xs leading-relaxed text-[var(--color-stone-haze)]">
              {profile.archetype.description}
            </p>
          </div>
        </header>

        {/* --- the numbers --------------------------------------------------- */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {profile.highlights.map((highlight) => (
            <StatCard
              key={highlight.label}
              value={highlight.value}
              label={highlight.label}
              hint={highlight.detail}
            />
          ))}
        </div>

        {/* --- the charts ---------------------------------------------------- */}
        <div className="mt-6">
          <ProfileCharts charts={charts} role={role} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* --- what to do next ------------------------------------------- */}
            <PanelCard
              title={mentor ? "What needs you next" : "What to work on next"}
              description={
                mentor
                  ? "Picked from what your mentees have handed in, what is past its deadline, and what nobody has started."
                  : "Only work still to do: picked from its deadline, your stated interests, the points it is worth and the kind of work you are strongest at."
              }
            >
              {profile.recommendations.length === 0 ? (
                <p className="text-sm text-[var(--color-iron-fixture)]">
                  {mentor
                    ? "Nothing needs you right now: nothing is waiting for a mark, past its deadline or untouched."
                    : "Nothing to suggest right now. Everything set for you has been handed in."}
                </p>
              ) : (
                <ul className="space-y-3">
                  {profile.recommendations.map((recommendation) => (
                    <li key={`${recommendation.resourceId}-${recommendation.kind}`}>
                      <RecommendationLink
                        // The dashboard is the viewer's own, so a link to it
                        // only makes sense on their own profile. A resource's
                        // own link works for anybody.
                        href={
                          recommendation.href &&
                          (isSelf || isExternal(recommendation.href))
                            ? recommendation.href
                            : undefined
                        }
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="text-sm font-bold">
                            {recommendation.title}
                          </p>
                          <Chip>{recommendation.kind}</Chip>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-iron-fixture)]">
                          {recommendation.reason}
                        </p>
                      </RecommendationLink>
                    </li>
                  ))}
                </ul>
              )}
            </PanelCard>

            {/* --- the badges ------------------------------------------------- */}
            <PanelCard
              title="Badges"
              description={
                mentor
                  ? "Earned from your mentees' numbers and the programs you run."
                  : "What the work you have done has earned you."
              }
            >
              {profile.badges.length === 0 ? (
                <p className="text-sm text-[var(--color-iron-fixture)]">
                  {mentor
                    ? "No badges yet. The first one comes with the first mentee."
                    : "No badges yet. The first one comes with the first piece of work you finish."}
                </p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {profile.badges.map((badge, index) => (
                    <li
                      key={badge.id}
                      // Each badge keeps one colour (from its id), so it is
                      // recognisable from one visit to the next. A warning
                      // badge stays amber, because that colour means
                      // something. The tiles rise in one after another.
                      style={
                        {
                          "--accent":
                            badge.tone === "warn" ? ACCENTS.amber : badgeAccent(badge.id),
                          animationDelay: `${Math.min(index, 7) * 40}ms`,
                        } as CSSProperties
                      }
                      className="tn-rise group rounded-xl border border-[color-mix(in_srgb,var(--accent)_25%,var(--color-night-white))] bg-[color-mix(in_srgb,var(--accent)_6%,var(--color-emptiness))] p-3.5 transition-[border-color,translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-md"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_16%,var(--color-emptiness))] text-[var(--accent)] transition-[scale] duration-200 group-hover:scale-110">
                          <IconSparkles className="h-4 w-4" />
                        </span>
                        <p className="text-sm font-bold">{badge.label}</p>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-iron-fixture)]">
                        {badge.description}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </PanelCard>
          </div>

          <div className="space-y-6">
            {/* --- the level ------------------------------------------------- */}
            <PanelCard title="Level">
              <p className="text-2xl font-extrabold tracking-tight">
                {profile.level.title}
              </p>
              <p className="mt-1 text-xs text-[var(--color-iron-fixture)]">
                Level {profile.level.number} · {profile.level.completed} of{" "}
                {profile.level.needed} {mentor ? "mentees" : "pieces of work"} to
                the next one
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-night-white)]">
                <div
                  className="h-full rounded-full bg-[var(--color-caviar)] transition-[width] duration-500"
                  style={{ width: `${Math.round(profile.level.fraction * 100)}%` }}
                />
              </div>
            </PanelCard>

            {/* --- the leaderboard ------------------------------------------- */}
            {showLeaderboard && leaderboard.length > 0 && (
              <PanelCard
                title="Leaderboard"
                description={
                  mentor
                    ? "Your mentees, at their place on the whole leaderboard."
                    : "Where you are."
                }
              >
                <ol className="space-y-1">
                  {leaderboard.slice(0, 8).map((row) => (
                    <li
                      key={row.id}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-sm",
                        row.id === selfId || row.id === selfName
                          ? "bg-[var(--color-night-white)] font-bold"
                          : "",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-5 text-xs tabular-nums text-[var(--color-iron-fixture)]">
                          {row.rank === 1 ? (
                            <IconTrophy className="h-4 w-4 text-[var(--color-amber)]" />
                          ) : (
                            row.rank
                          )}
                        </span>
                        {row.name}
                      </span>
                      <span className="flex items-center gap-2 text-xs tabular-nums text-[var(--color-iron-fixture)]">
                        {row.streak > 0 && (
                          <IconFlame className="h-3.5 w-3.5 text-[var(--color-amber)]" />
                        )}
                        {row.totalScore}
                      </span>
                    </li>
                  ))}
                </ol>
              </PanelCard>
            )}

            {isSelf && (
              <Link
                href="/techboard"
                className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-spotted-dove)] px-5 py-4 transition-colors duration-150 hover:bg-[var(--color-night-white)]"
              >
                <span className="text-sm font-bold">Back to your dashboard</span>
                <IconArrowUpRight className="h-4 w-4 text-[var(--color-iron-fixture)]" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * True for a link that leaves the site.
 */
function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/**
 * A recommendation card. It is a link to where the work is when there is
 * somewhere to go, and a plain card otherwise. A link that leaves the site
 * opens in a new tab so the profile stays where it was.
 */
function RecommendationLink({
  href,
  children,
}: {
  href?: string;
  children: ReactNode;
}) {
  const card = "block rounded-xl border border-[var(--color-night-white)] p-4";
  if (!href) return <div className={card}>{children}</div>;

  const linked = cn(
    card,
    "group transition-[border-color,background-color] duration-150 hover:border-[var(--color-spotted-dove)] hover:bg-[var(--color-night-white)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-plum-bright)]",
  );

  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={linked}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={linked}>
      {children}
    </Link>
  );
}

/**
 * The ring around the crest, showing how far to the next level.
 */
function LevelRing({ level }: { level: AiProfile["level"] }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.max(0.02, Math.min(1, level.fraction));

  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 size-full text-[var(--color-spotted-dove)]"
      role="presentation"
    >
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="var(--color-caviar)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={circumference * (1 - filled)}
        transform="rotate(-90 50 50)"
        style={{
          transition: "stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </svg>
  );
}

/**
 * A badge's colour, picked from its id so it is the same every time.
 */
function badgeAccent(id: string): string {
  const order: Accent[] = ["violet", "amber", "green", "bronze"];
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return ACCENTS[order[hash % order.length]];
}
