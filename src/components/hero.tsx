import { IconArrowRight, IconRocket } from "@tabler/icons-react";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { SplashGate } from "@/components/ui/splash-gate";
import { WavyBackground } from "@/components/ui/wavy-background";

export default function Hero() {
  return (
    <section id="home" className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-[var(--color-emptiness)]">
      {/* Wavy background layer */}
      <WavyBackground
        containerClassName="absolute inset-0 h-full w-full"
        colors={[
          "var(--color-night-white)",
          "var(--color-spotted-dove)",
          "var(--color-night-white)",
          "var(--color-spotted-dove)",
          "var(--color-night-white)",
        ]}
        backgroundFill="transparent"
        waveOpacity={0.3}
        blur={18}
        waveWidth={50}
      />

      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-subtle-grid opacity-60 pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Pill Announcement */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[var(--color-night-white)] border border-[var(--color-spotted-dove)] text-[var(--color-caviar)]">
            <span className="flex h-2 w-2 rounded-full bg-[var(--color-caviar)]" />
            <span className="font-bold">TechNeeds IGDTUW</span>
            <span className="text-[var(--color-stone-haze)]">•</span>
            <span className="text-[var(--color-iron-fixture)]">Mentorship Cohorts Open</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--color-caviar)] leading-[1.15]">
              {/* The headline encrypts itself once the splash has cleared. */}
              <SplashGate fallback={<span>Upgrade Yourself!</span>}>
                <EncryptedText
                  text="Upgrade Yourself!"
                  encryptedClassName="text-[var(--color-stone-haze)]"
                  revealedClassName="text-[var(--color-caviar)]"
                />
              </SplashGate>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[var(--color-iron-fixture)] max-w-2xl mx-auto leading-relaxed">
            At <strong className="text-[var(--color-caviar)] font-semibold">TechNeeds IGDTUW</strong>, we are
            passionate about engineering excellence. As Indira Gandhi Delhi Technical University for
            Women&apos;s premier tech community, we empower <strong className="text-[var(--color-caviar)] font-semibold">1,200+ students</strong> through
            cohort-driven mentorship, flagship hackathons, and 1-on-1 industry guidance.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#cohorts"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm text-[var(--color-emptiness)] bg-[var(--color-caviar)] hover:bg-[var(--color-iron-fixture)] shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Explore Cohorts</span>
              <IconArrowRight className="w-4 h-4" />
            </a>

            <a
              href="#glimpse"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm text-[var(--color-caviar)] bg-[var(--color-night-white)] hover:bg-[var(--color-spotted-dove)]/40 border border-[var(--color-spotted-dove)] transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <IconRocket className="w-4 h-4 text-[var(--color-iron-fixture)]" />
              <span>Community Events</span>
            </a>

            <a
              href="#about"
              className="text-sm font-semibold text-[var(--color-iron-fixture)] hover:text-[var(--color-caviar)] transition-colors underline-offset-4 hover:underline px-2 py-1"
            >
              Know More →
            </a>
          </div>

          {/* Quick trust proofs */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--color-iron-fixture)] border-t border-[var(--color-night-white)]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-caviar)]" />
              <span>IGDTUW&apos;s #1 Tech Society</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-stone-haze)]" />
              <span>1,200+ Active Mentees</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-iron-fixture)]" />
              <span>50+ Professional Mentors</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
