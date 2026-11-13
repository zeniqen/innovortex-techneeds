"use client";

import React from "react";
import Image from "next/image";
import { GridBackground } from "@/components/ui/grid-background";

export default function Glimpse() {
  return (
    <section id="glimpse" className="py-24 relative overflow-hidden bg-[var(--color-night-white)]/30 border-t border-[var(--color-night-white)]">
      {/* Faded grid backdrop */}
      <GridBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-caviar)]">
            Glimpse of Life at TechNeeds
          </h2>
          <p className="text-[var(--color-iron-fixture)] text-sm sm:text-base leading-relaxed">
            Hackathons, workshops and sessions on campus: a few moments from 100+ events the society
            has run.
          </p>
        </div>

        {/* Single Glimpse Image */}
        <div className="relative overflow-hidden rounded-3xl border border-[var(--color-spotted-dove)] bg-[var(--color-emptiness)] shadow-sm">
          <Image
            src="/assets/glimpse.png"
            alt="Glimpse of Life at TechNeeds IGDTUW"
            width={1557}
            height={1080}
            sizes="(max-width: 1024px) 100vw, 1152px"
            className="w-full h-auto"
          />
        </div>
      </div>
    </section>
  );
}
