"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  IconUsers,
  IconAward,
  IconSchool,
  IconCalendarEvent,
} from "@tabler/icons-react";
import { Counter } from "@/components/ui/animated-counter";

/** How long the count runs, in seconds. */
const COUNT_DURATION = 1.6;
/** Delay between each stat starting, in ms. */
const STAGGER = 120;

export default function Stats() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  const stats = [
    {
      value: 1200,
      separator: ",",
      suffix: "+",
      label: "Trained Mentees",
      description: "Empowering female engineers across batches to break into top product companies.",
      icon: <IconUsers className="w-6 h-6 text-[var(--color-caviar)]" />,
    },
    {
      value: 50,
      suffix: "+",
      label: "Professional Mentors",
      description: "Proven guidance from seniors and industry engineers at Microsoft, Google, and Amazon.",
      icon: <IconAward className="w-6 h-6 text-[var(--color-caviar)]" />,
    },
    {
      value: 10,
      suffix: "+",
      label: "Mentorship Cohorts",
      description: "Structured curriculum covering Web Dev, C++ DSA, AI/ML, and Open Source contributions.",
      icon: <IconSchool className="w-6 h-6 text-[var(--color-caviar)]" />,
    },
    {
      value: 100,
      suffix: "+",
      label: "Amazing Events",
      description: "Hackathons, speaker series, mock coding contests, and tech workshops on campus.",
      icon: <IconCalendarEvent className="w-6 h-6 text-[var(--color-caviar)]" />,
    },
  ];

  // Fire once, the first time the section enters the viewport.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="py-20 relative bg-[var(--color-emptiness)] border-y border-[var(--color-night-white)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-night-white)] text-[var(--color-caviar)] border border-[var(--color-spotted-dove)]">
            <span>IGDTUW Students&apos; First Choice</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-caviar)]">
            Proven Impact That Speaks For Itself
          </h2>
          <p className="text-[var(--color-iron-fixture)] text-sm sm:text-base leading-relaxed">
            TechNeeds IGDTUW bridges the gap between college curriculum and real-world tech careers,
            fostering peer learning, problem solving, and women leadership in STEM.
          </p>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="relative group rounded-2xl p-6 bg-[var(--color-emptiness)] border border-[var(--color-spotted-dove)] hover:border-[var(--color-caviar)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-night-white)] border border-[var(--color-spotted-dove)] flex items-center justify-center transition-transform group-hover:scale-105">
                  {stat.icon}
                </div>

                <div>
                  {/* Screen readers get the final value; the animated digits are decorative. */}
                  <span className="sr-only">
                    {stat.value.toLocaleString("en-US")}
                    {stat.suffix}
                  </span>
                  <Counter
                    end={stat.value}
                    separator={stat.separator}
                    suffix={stat.suffix}
                    duration={COUNT_DURATION}
                    active={inView}
                    delay={idx * STAGGER}
                    aria-hidden="true"
                    className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--color-caviar)] px-0 rounded-none"
                  />
                  <div className="text-base font-semibold text-[var(--color-caviar)] mt-1">
                    {stat.label}
                  </div>
                </div>

                <p className="text-xs text-[var(--color-iron-fixture)] leading-relaxed">
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
