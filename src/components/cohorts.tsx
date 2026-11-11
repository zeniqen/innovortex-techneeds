"use client";

import React from "react";
import {
  IconSchool,
} from "@tabler/icons-react";
import CarouselDemo from "@/components/carousel-demo";
import { AuroraBackground } from "@/components/ui/aurora-background";

export default function Cohorts() {
  return (
    <section id="cohorts" className="py-24 relative overflow-hidden bg-[var(--color-emptiness)]">
      {/* Aurora backdrop */}
      <AuroraBackground
        className="absolute inset-0 h-full w-full bg-transparent"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-night-white)] text-[var(--color-caviar)] border border-[var(--color-spotted-dove)]">
            <IconSchool className="w-3.5 h-3.5 text-[var(--color-iron-fixture)]" />
            <span>Structured Mentorship</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-caviar)]">
            Our Mentorship Cohorts
          </h2>
          <p className="text-[var(--color-iron-fixture)] text-sm sm:text-base leading-relaxed">
            Led by proven seniors and top alumnae, our cohort-based mentorship provides clear roadmaps,
            code reviews, and accountability to guarantee your tech growth.
          </p>
        </div>

        {/* Carousel */}
        <CarouselDemo />
      </div>
    </section>
  );
}
