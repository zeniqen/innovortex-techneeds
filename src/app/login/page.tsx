import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { IconArrowLeft } from "@tabler/icons-react";

import { SignInForm } from "@/components/platform/sign-in-form";
import { optionalUser, panelPath } from "@/lib/platform/guards";

export const metadata: Metadata = {
  title: "Sign in | TechNeeds IGDTUW",
  description:
    "Sign in to the TechNeeds mentorship platform as a mentee, a mentor or an admin.",
};

/**
 * This page reads the session cookie, so it cannot be prerendered into the
 * static shell. It blocks on the server instead.
 */
export const instant = false;

/**
 * Signing in.
 *
 * Somebody who is already signed in is sent straight to their panel.
 */
export default function Page() {
  return (
    <main className="flex min-h-screen flex-col bg-[var(--color-emptiness)] text-[var(--color-caviar)]">
      <Suspense fallback={<SignInFallback />}>
        <SignInBody />
      </Suspense>
    </main>
  );
}

async function SignInBody() {
  const user = await optionalUser();

  if (user) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 text-center">
        <p className="text-sm text-[var(--color-iron-fixture)]">
          You are signed in as {user.name}.
        </p>
        <Link
          href={panelPath(user.role)}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--color-caviar)] px-4 py-2.5 text-sm font-bold text-[var(--color-emptiness)] transition-colors hover:bg-[var(--color-iron-fixture)]"
        >
          Go to your panel
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 self-start text-xs font-semibold text-[var(--color-iron-fixture)] transition-colors hover:text-[var(--color-caviar)]"
      >
        <IconArrowLeft className="h-3.5 w-3.5" />
        Back to the site
      </Link>

      <h1 className="text-3xl font-extrabold tracking-tight">Sign in</h1>
      <p className="mt-2 mb-8 text-sm leading-relaxed text-[var(--color-iron-fixture)]">
        The mentorship platform. Mentees sign in with the enrollment number
        their mentor gave them.
      </p>

      <SignInForm />
    </div>
  );
}

function SignInFallback() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <div className="mb-8 h-4 w-24 animate-pulse rounded bg-[var(--color-night-white)]" />
      <div className="h-9 w-40 animate-pulse rounded-xl bg-[var(--color-night-white)]" />
      <div className="mt-3 h-4 w-full animate-pulse rounded bg-[var(--color-night-white)]" />
      <div className="mt-8 h-80 animate-pulse rounded-2xl bg-[var(--color-night-white)]" />
    </div>
  );
}
