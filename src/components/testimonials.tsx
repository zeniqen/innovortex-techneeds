"use client";

import React from "react";
import {
  IconHeart,
} from "@tabler/icons-react";
import ThreeDMarqueeDemo from "@/components/3d-marquee-demo";

export default function Testimonials() {
  return (
    <section
      id="testimonials"
      className="py-24 relative bg-[var(--color-emptiness)] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-night-white)] text-[var(--color-caviar)] border border-[var(--color-spotted-dove)]">
            <IconHeart className="w-3.5 h-3.5 text-[var(--color-stone-haze)]" />
            <span>Wall of Love</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-caviar)]">
            What Our Students Say
          </h2>
          <p className="text-[var(--color-iron-fixture)] text-sm sm:text-base leading-relaxed">
            Real feedback from IGDTUW students and cohort participants who transformed their coding
            journey with TechNeeds.
          </p>
        </div>

        {/* Testimonials in the 3D marquee */}
        <ThreeDMarqueeDemo />
      </div>
    </section>
  );
}
