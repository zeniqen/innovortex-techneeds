"use client";

import { useEffect } from "react";

import { BackendDown, isBackendDown } from "@/components/platform/backend-down";

/**
 * What happens when a profile cannot be shown.
 */
export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  if (isBackendDown(error)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <BackendDown detail={error.message} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-2xl border border-[var(--color-loss)]/30 bg-[var(--color-loss)]/5 p-6">
        <p className="text-sm font-bold">Something went wrong</p>
        <p className="mt-2 text-xs leading-relaxed text-[var(--color-iron-fixture)]">
          {error.message || "The profile could not be shown."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-xl bg-[var(--color-caviar)] px-4 py-2.5 text-xs font-bold text-[var(--color-emptiness)] transition-colors hover:bg-[var(--color-iron-fixture)]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
