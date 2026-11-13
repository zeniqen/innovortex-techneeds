import { PanelCard } from "./primitives";
import { ScoreChart } from "./score-chart";
import type { ProfileCharts as Charts } from "@/lib/platform/ai/charts";

/**
 * The charts on the profile.
 *
 * Every chart is drawn in the theme's ink, one hue at different
 * strengths, so they follow the palette picker and stay as quiet as the
 * rest of the page. Each bar carries its numbers as text beside it, so
 * nothing is told by colour alone.
 */
export function ProfileCharts({
  charts,
  role,
}: {
  charts: Charts;
  role: "mentee" | "mentor";
}) {
  const hasWork = charts.byType.some((row) => row.total > 0);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <PanelCard
        title={role === "mentor" ? "What you have published" : "Progress by kind of work"}
        description={
          role === "mentor"
            ? "The resources on your programs, by kind."
            : "How much of each kind of work has been marked, out of what was set."
        }
      >
        {hasWork ? (
          <BarRows
            rows={charts.byType.map((row) => ({
              key: row.type,
              label: row.label,
              value: row.done,
              max: role === "mentor" ? Math.max(...charts.byType.map((r) => r.total)) : row.total,
              text: role === "mentor" ? `${row.total}` : `${row.done} of ${row.total}`,
            }))}
          />
        ) : (
          <Empty>Nothing has been set yet.</Empty>
        )}
      </PanelCard>

      {role === "mentee" ? (
        <PanelCard
          title="Points over time"
          description="The running total, one step for each mark."
        >
          {charts.scoreOverTime.length > 0 ? (
            <ScoreChart points={charts.scoreOverTime} />
          ) : (
            <Empty>No marks yet. The line starts with the first one.</Empty>
          )}
        </PanelCard>
      ) : (
        <PanelCard
          title="Your mentees' points"
          description="Highest first."
        >
          {charts.mentees.length > 0 ? (
            <BarRows
              rows={charts.mentees.slice(0, 8).map((mentee) => ({
                key: mentee.id,
                label: mentee.name,
                value: mentee.score,
                max: Math.max(1, charts.mentees[0].score),
                text: `${mentee.score}`,
              }))}
            />
          ) : (
            <Empty>No mentees yet.</Empty>
          )}
        </PanelCard>
      )}

      {role === "mentee" && (
        <PanelCard
          title="Where your work is"
          description="Every piece of work set for you, by where it stands."
          className="md:col-span-2"
        >
          <StatusBar segments={charts.status} />
        </PanelCard>
      )}
    </div>
  );
}

/**
 * Horizontal bars, each with its label and its number in text.
 */
function BarRows({
  rows,
}: {
  rows: { key: string; label: string; value: number; max: number; text: string }[];
}) {
  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const fraction = row.max > 0 ? row.value / row.max : 0;
        return (
          <li key={row.key} title={`${row.label}: ${row.text}`}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
              <span className="min-w-0 truncate font-semibold">{row.label}</span>
              <span className="shrink-0 tabular-nums text-[var(--color-iron-fixture)]">
                {row.text}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--color-night-white)]">
              <div
                className="h-full rounded-full bg-[var(--color-caviar)] transition-[width] duration-500"
                style={{ width: `${Math.round(fraction * 100)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The status split, as one bar cut into parts.
 *
 * The parts are in order from finished to untouched, so the shades run
 * from the darkest to the lightest - the order is the meaning.
 */
const SHADES = [1, 0.62, 0.36, 0.16];

function StatusBar({
  segments,
}: {
  segments: { key: string; label: string; count: number }[];
}) {
  const total = segments.reduce((sum, s) => sum + s.count, 0);
  if (total === 0) return <Empty>Nothing has been set yet.</Empty>;

  return (
    <div>
      {/* The gap between parts is the page showing through, so two
          neighbouring shades never touch. */}
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full">
        {segments.map((segment, index) =>
          segment.count === 0 ? null : (
            <div
              key={segment.key}
              title={`${segment.label}: ${segment.count}`}
              className="h-full"
              style={{
                flexGrow: segment.count,
                background: `color-mix(in srgb, var(--color-caviar) ${SHADES[index] * 100}%, var(--color-emptiness))`,
              }}
            />
          ),
        )}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs">
        {segments.map((segment, index) => (
          <li key={segment.key} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-sm"
              style={{
                background: `color-mix(in srgb, var(--color-caviar) ${SHADES[index] * 100}%, var(--color-emptiness))`,
              }}
            />
            <span className="text-[var(--color-iron-fixture)]">{segment.label}</span>
            <span className="font-bold tabular-nums">{segment.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[var(--color-iron-fixture)]">{children}</p>;
}
