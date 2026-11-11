import type { Metadata } from "next";
import Techboard from "@/components/techboard";
import Footer from "@/components/footer";
import FloatingDockDemo from "@/components/floating-dock-demo";

export const metadata: Metadata = {
  title: "Techboard | TechNeeds IGDTUW",
  description:
    "The TechNeeds IGDTUW techboard — find your cohort, mentor with us, or get to know the community.",
};

export default function Page() {
  return (
    <div className="relative min-h-screen bg-[var(--color-emptiness)] text-[var(--color-caviar)] flex flex-col selection:bg-[var(--color-caviar)] selection:text-[var(--color-emptiness)]">
      <main className="flex-1">
        <Techboard />
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Dock Navigation */}
      <FloatingDockDemo />
    </div>
  );
}
