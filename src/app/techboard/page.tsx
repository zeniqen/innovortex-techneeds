import type { Metadata } from "next";
import { Suspense } from "react";

import Footer from "@/components/footer";
import FloatingDockDemo from "@/components/floating-dock-demo";
import Techboard from "@/components/techboard";
import { AdminPanel } from "@/components/platform/admin-panel";
import { MentorPanel } from "@/components/platform/mentor-panel";
import { MenteePanel } from "@/components/platform/mentee-panel";
import { PanelSkeleton } from "@/components/platform/primitives";
import { optionalUser } from "@/lib/platform/guards";

export const metadata: Metadata = {
  title: "Techboard | TechNeeds IGDTUW",
  description:
    "The TechNeeds IGDTUW techboard: your mentorship dashboard, or find your cohort and mentor with us.",
};

/**
 * This page reads the session cookie, so it cannot be prerendered into the
 * static shell. It blocks on the server instead.
 */
export const instant = false;

/**
 * The techboard.
 *
 * Signed out, it is the page that asks whether you are a mentee, a mentor
 * or neither. Signed in, it is that person's dashboard: the work they have
 * been set, the mentees they look after, or the programs they run.
 */
export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--color-emptiness)] text-[var(--color-caviar)] selection:bg-[var(--color-caviar)] selection:text-[var(--color-emptiness)]">
      <main className="flex-1">
        <Suspense fallback={<PanelSkeleton />}>
          <TechboardBody searchParams={searchParams} />
        </Suspense>
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Dock Navigation */}
      <FloatingDockDemo />
    </div>
  );
}

async function TechboardBody({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>;
}) {
  const user = await optionalUser();
  const { program } = await searchParams;

  if (!user) {
    return <Techboard />;
  }

  if (user.role === "mentee") {
    return <MenteePanel user={user} />;
  }

  if (user.role === "mentor") {
    return <MentorPanel user={user} programId={program} />;
  }

  return <AdminPanel user={user} programId={program} />;
}
