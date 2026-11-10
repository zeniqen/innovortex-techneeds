import Hero from "@/components/hero";
import Stats from "@/components/stats";
import Mission from "@/components/mission";
import Cohorts from "@/components/cohorts";
import Glimpse from "@/components/glimpse";
import Testimonials from "@/components/testimonials";
import Footer from "@/components/footer";
import FloatingDockDemo from "@/components/floating-dock-demo";
import { PageReveal } from "@/components/ui/page-reveal";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[var(--color-emptiness)] text-[var(--color-caviar)] flex flex-col selection:bg-[var(--color-caviar)] selection:text-[var(--color-emptiness)]">
      {/* Main Content Sections — revealed top to bottom on route changes */}
      <main className="flex-1">
        <PageReveal>
          <Hero />
          <Stats />
          <Mission />
          <Cohorts />
          <Glimpse />
          <Testimonials />
        </PageReveal>
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Dock Navigation */}
      <FloatingDockDemo />
    </div>
  );
}
