"use client";

import React from "react";
import Image from "next/image";
import {
  IconTarget,
  IconCode,
  IconTrophy,
  IconMicrophone,
  IconUsersGroup,
} from "@tabler/icons-react";

export default function Mission() {
  const offerings = [
    {
      title: "In-Depth Insights & Curated Tracks",
      description:
        "Structured learning paths designed by seniors who cracked top internships, bypassing outdated tutorials.",
      icon: <IconCode className="w-6 h-6" />,
      accent: "var(--color-plum-bright)",
      tag: "Curriculum",
    },
    {
      title: "Flagship Hackathons & Events",
      description:
        "High-stakes 24-hour coding sprints with live mentor desks, problem statements from tech leaders, and grand prizes.",
      icon: <IconTrophy className="w-6 h-6" />,
      accent: "var(--color-gold-deep)",
      tag: "Competition",
    },
    {
      title: "Speaker Sessions & Industry AMAs",
      description:
        "Direct interactions with engineers, founders, and alumnae working at Microsoft, Google, Goldman Sachs, and top startups.",
      icon: <IconMicrophone className="w-6 h-6" />,
      accent: "var(--color-gain)",
      tag: "Networking",
    },
    {
      title: "Vibrant IGDTUW Peer Community",
      description:
        "Collaborative study rooms, hackathon team matching, DSA problem-of-the-day discussions, and round-the-clock help desks.",
      icon: <IconUsersGroup className="w-6 h-6" />,
      accent: "var(--color-bronze-deep)",
      tag: "Community",
    },
  ];

  return (
    <section className="py-20 relative bg-[var(--color-emptiness)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mission Banner Card */}
        <div className="relative rounded-3xl p-8 sm:p-12 bg-[var(--color-night-white)]/60 border border-[var(--color-spotted-dove)] mb-16 overflow-hidden">
          <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-emptiness)] text-[var(--color-caviar)] border border-[var(--color-spotted-dove)]">
                <IconTarget className="w-3.5 h-3.5 text-[var(--color-plum-bright)]" />
                <span>Our Core Mission</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--color-caviar)] tracking-tight">
                Empowering every woman engineer at IGDTUW to{" "}
                <span className="text-[var(--color-plum-bright)]">
                  lead the tech revolution.
                </span>
              </h2>
              <p className="text-[var(--color-iron-fixture)] text-sm sm:text-base leading-relaxed max-w-2xl">
                To be the ultimate go-to resource for anyone seeking to understand, build, and conquer
                the ever-evolving world of software development. We nurture curious beginners into
                hackathon champions and skilled software engineers.
              </p>
            </div>

            <div className="lg:col-span-4 flex justify-center">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 p-2 rounded-2xl bg-[var(--color-emptiness)] border border-[var(--color-spotted-dove)] shadow-sm flex items-center justify-center">
                <Image
                  src="/assets/about3.png"
                  alt="TechNeeds Mission Illustration"
                  width={220}
                  height={220}
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* What We Offer Grid */}
        <div className="space-y-8">
          <div className="text-left space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-night-white)] text-[var(--color-caviar)] border border-[var(--color-spotted-dove)]">
              <span>What We Offer</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-caviar)] tracking-tight">
              A Comprehensive Ecosystem Built For Coders
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {offerings.map((item, idx) => (
              <div
                key={idx}
                style={{ "--accent": item.accent } as React.CSSProperties}
                className="group relative overflow-hidden rounded-2xl p-6 bg-[var(--color-emptiness)] border border-[var(--color-spotted-dove)] hover:border-[var(--accent)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between"
              >
                {/* A thin line of the card's colour along the top. */}
                <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-[var(--accent)]" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl text-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,var(--color-emptiness))] border border-[color-mix(in_srgb,var(--accent)_30%,var(--color-emptiness))] flex items-center justify-center transition-transform group-hover:scale-105">
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,var(--color-emptiness))] border border-[color-mix(in_srgb,var(--accent)_25%,var(--color-emptiness))]">
                      {item.tag}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-[var(--color-caviar)]">
                    {item.title}
                  </h4>

                  <p className="text-xs text-[var(--color-iron-fixture)] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[var(--color-night-white)] flex items-center text-xs font-semibold text-[var(--color-caviar)]">
                  <span>Learn more</span>
                  <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
