import type { Metadata } from "next";
import FaqPage from "@/components/faq-page";
import Footer from "@/components/footer";
import FloatingDockDemo from "@/components/floating-dock-demo";

export const metadata: Metadata = {
  title: "FAQs | TechNeeds IGDTUW",
  description:
    "Frequently asked questions about TechNeeds IGDTUW — what we do, how to reach us, and how to track your mentorship journey.",
};

export default function Page() {
  return (
    <div className="relative min-h-screen bg-[var(--color-emptiness)] text-[var(--color-caviar)] flex flex-col selection:bg-[var(--color-caviar)] selection:text-[var(--color-emptiness)]">
      <main className="flex-1">
        <FaqPage />
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Dock Navigation */}
      <FloatingDockDemo />
    </div>
  );
}
