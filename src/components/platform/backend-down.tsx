import { IconPlugConnectedX } from "@tabler/icons-react";

/**
 * What is shown when the platform backend cannot be reached.
 *
 * The platform talks to the backend running on this machine, so this is
 * usually the answer: it is not running yet.
 */
export function BackendDown({ detail }: { detail?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10 p-6">
      <p className="flex items-center gap-2 text-sm font-bold">
        <IconPlugConnectedX className="h-4 w-4" />
        The platform backend is not running
      </p>
      <p className="mt-2 text-xs leading-relaxed text-[var(--color-iron-fixture)]">
        The platform keeps its data in the backend that came with it, on this
        machine. Start it and try again:
      </p>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-[var(--color-caviar)] px-4 py-3 text-[0.7rem] leading-relaxed text-[var(--color-emptiness)]">
        {`cd backend
cp .env.example .env    # then fill in MONGO_URI, JWT_SECRET, ADMIN_KEY
npm install
npm start`}
      </pre>
      <p className="mt-3 text-xs leading-relaxed text-[var(--color-iron-fixture)]">
        Or run without it, keeping the data in this project&apos;s own
        database instead:{" "}
        <code className="rounded bg-[var(--color-night-white)] px-1.5 py-0.5 font-mono text-[0.7rem]">
          PLATFORM_BACKEND=sqlite npm run dev
        </code>
      </p>
      {detail && (
        <p className="mt-3 text-[0.7rem] leading-relaxed text-[var(--color-stone-haze)]">
          {detail}
        </p>
      )}
    </div>
  );
}

/**
 * True when an error is the backend being unreachable, rather than
 * something being wrong with the request.
 */
export function isBackendDown(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("Could not reach the platform backend") ||
    error.message.includes("ECONNREFUSED") ||
    error.message.includes("fetch failed")
  );
}
