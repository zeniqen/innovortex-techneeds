"use client";

import React from "react";
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
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-caviar)]">
            What Our Students Say
          </h2>
          <p className="text-[var(--color-iron-fixture)] text-sm sm:text-base leading-relaxed">
            In their own words: IGDTUW students who have been through a TechNeeds cohort or event.
          </p>
        </div>

        {/* Testimonials in the 3D marquee */}
        <ThreeDMarqueeDemo />
      </div>
    </section>
  );
}
