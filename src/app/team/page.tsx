import type { Metadata } from "next";
import Team from "@/components/team";
import Footer from "@/components/footer";
import FloatingDockDemo from "@/components/floating-dock-demo";

export const metadata: Metadata = {
  title: "Team | TechNeeds IGDTUW",
  description:
    "Meet the students behind TechNeeds IGDTUW — the founders, leads and team heads who run our mentorship cohorts, events and community.",
};

export default function Page() {
  return (
    <div className="relative min-h-screen bg-[var(--color-emptiness)] text-[var(--color-caviar)] flex flex-col selection:bg-[var(--color-caviar)] selection:text-[var(--color-emptiness)]">
      <main className="flex-1">
        <Team />
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Dock Navigation */}
      <FloatingDockDemo />
    </div>
  );
}
