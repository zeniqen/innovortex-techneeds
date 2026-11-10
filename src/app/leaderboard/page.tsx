import type { Metadata } from "next";
import Leaderboard from "@/components/leaderboard";
import Footer from "@/components/footer";
import FloatingDockDemo from "@/components/floating-dock-demo";

export const metadata: Metadata = {
  title: "Leaderboard | TechNeeds IGDTUW",
  description:
    "See how the TechNeeds IGDTUW mentees are stacking up — total scores, ranks and daily streaks across the community.",
};

export default function Page() {
  return (
    <div className="relative min-h-screen bg-[var(--color-emptiness)] text-[var(--color-caviar)] flex flex-col selection:bg-[var(--color-caviar)] selection:text-[var(--color-emptiness)]">
      <main className="flex-1">
        <Leaderboard />
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Dock Navigation */}
      <FloatingDockDemo />
    </div>
  );
}
