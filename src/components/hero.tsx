import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { SplashGate } from "@/components/ui/splash-gate";
import { WavyBackground } from "@/components/ui/wavy-background";

export default function Hero() {
  return (
    <section id="home" className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-[var(--color-emptiness)]">
      {/* Wavy background layer */}
      <WavyBackground
        containerClassName="absolute inset-0 h-full w-full"
        // The site's accent colours, blurred and faint, so the hero has a
        // warm wash of colour without competing with the headline.
        colors={[
          "var(--color-plum-bright)",
          "var(--color-gold)",
          "var(--color-gain)",
          "var(--color-bronze)",
          "var(--color-plum-bright)",
        ]}
        backgroundFill="transparent"
        waveOpacity={0.18}
        blur={18}
        waveWidth={50}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Pill Announcement */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[var(--color-night-white)] border border-[var(--color-spotted-dove)] text-[var(--color-caviar)]">
            {/* Green, because the cohorts are open. */}
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-gain)] opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-gain)]" />
            </span>
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
            <strong className="text-[var(--color-caviar)] font-semibold">TechNeeds IGDTUW</strong> is the
            student tech society of Indira Gandhi Delhi Technical University for Women. Seniors mentor
            juniors through structured cohorts, and we have trained{" "}
            <strong className="text-[var(--color-plum-bright)] font-semibold">1,200+ mentees</strong> so far.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm text-[var(--color-emptiness)] bg-[var(--color-caviar)] hover:bg-[var(--color-iron-fixture)] shadow-md transition-[translate,background-color,box-shadow] hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Open the platform</span>
              <IconArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#cohorts"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm text-[var(--color-caviar)] bg-[var(--color-night-white)] hover:bg-[var(--color-spotted-dove)]/40 border border-[var(--color-spotted-dove)] transition-[translate,background-color,box-shadow] hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Explore Cohorts</span>
            </a>
          </div>

          {/* Quick trust proofs */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--color-iron-fixture)] border-t border-[var(--color-night-white)]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-plum-bright)]" />
              <span>10+ Mentorship Cohorts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold-deep)]" />
              <span>1,200+ Trained Mentees</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gain)]" />
              <span>50+ Professional Mentors</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
