"use client";

import React from "react";
import Image from "next/image";
import {
  IconPhoto,
} from "@tabler/icons-react";

export default function Glimpse() {
  return (
    <section id="glimpse" className="py-24 relative bg-[var(--color-night-white)]/30 border-t border-[var(--color-night-white)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-night-white)] text-[var(--color-caviar)] border border-[var(--color-spotted-dove)]">
            <IconPhoto className="w-3.5 h-3.5 text-[var(--color-iron-fixture)]" />
            <span>Community Memories</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-caviar)]">
            Glimpse of Life at TechNeeds
          </h2>
          <p className="text-[var(--color-iron-fixture)] text-sm sm:text-base leading-relaxed">
            From late-night hackathon debugging to high-energy campus bootcamps, take a peek at the
            vibrant culture driving IGDTUW&apos;s premier tech society.
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
