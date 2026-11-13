import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { IconArrowLeft } from "@tabler/icons-react";

import { SignInForm } from "@/components/platform/sign-in-form";
import { SetupCard } from "@/components/platform/setup-card";
import Footer from "@/components/footer";
import FloatingDockDemo from "@/components/floating-dock-demo";
import { optionalUser, panelPath } from "@/lib/platform/guards";
import {
  adminCount,
} from "@/lib/platform/admin-store";

export const metadata: Metadata = {
  title: "Sign in | TechNeeds IGDTUW",
  description:
    "Sign in to the TechNeeds mentorship platform as a mentee or a mentor.",
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
export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ as?: string }>;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--color-emptiness)] text-[var(--color-caviar)] selection:bg-[var(--color-caviar)] selection:text-[var(--color-emptiness)]">
      <main className="flex flex-1 flex-col">
        <Suspense fallback={<SignInFallback />}>
          <SignInBody searchParams={searchParams} />
        </Suspense>
      </main>

      <Footer />
      <FloatingDockDemo />
    </div>
  );
}

async function SignInBody({
  searchParams,
}: {
  searchParams: Promise<{ as?: string }>;
}) {
  const user = await optionalUser();
  // The admin form is not offered on the public page; it is reached at
  // /login?as=admin, which nothing on the site links to.
  const asAdmin = (await searchParams).as === "admin";

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

  // Until there is an admin there is no way in, and the admin panel needs
  // an admin, so the setup lives here on the sign-in page.
  const needsSetup = (await adminCount()) === 0;

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

      {needsSetup ? (
        <SetupCard />
      ) : (
        <SignInForm admin={asAdmin} />
      )}
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
