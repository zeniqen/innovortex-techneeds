"use client";

import React from "react";
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
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-caviar)]">
            Our Mentorship{" "}
            <span className="text-[var(--color-plum-bright)]">Cohorts</span>
          </h2>
          <p className="text-[var(--color-iron-fixture)] text-sm sm:text-base leading-relaxed">
            Each cohort is run by seniors who set the work, review what you hand in and keep you to a
            deadline, so you always know what to do next.
          </p>
        </div>

        {/* Carousel */}
        <CarouselDemo />
      </div>
    </section>
  );
}
