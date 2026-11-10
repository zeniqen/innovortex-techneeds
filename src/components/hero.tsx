"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  IconArrowRight,
  IconRocket,
  IconCode,
  IconTerminal,
  IconCheck,
  IconCopy,
} from "@tabler/icons-react";

export default function Hero() {
  const [activeTab, setActiveTab] = useState<"terminal" | "cohorts">("terminal");
  const [copied, setCopied] = useState(false);

  const copyCommand = () => {
    navigator.clipboard.writeText("npx create-techneeds-app@latest");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="home" className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-[var(--color-emptiness)]">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-subtle-grid opacity-60 pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline and Call-to-actions */}
          <div className="lg:col-span-7 text-left space-y-6">
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
                Upgrade Yourself! <br />
                <span className="text-[var(--color-stone-haze)]">
                  Innovate. Code. Conquer.
                </span>
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[var(--color-iron-fixture)] max-w-2xl leading-relaxed">
              At <strong className="text-[var(--color-caviar)] font-semibold">TechNeeds IGDTUW</strong>, we are
              passionate about engineering excellence. As Indira Gandhi Delhi Technical University for
              Women&apos;s premier tech community, we empower <strong className="text-[var(--color-caviar)] font-semibold">1,200+ students</strong> through
              cohort-driven mentorship, flagship hackathons, and 1-on-1 industry guidance.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
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
            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-[var(--color-iron-fixture)] border-t border-[var(--color-night-white)]">
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

          {/* Right Column: Interactive Card & Illustration */}
          <div className="lg:col-span-5 relative">
            {/* Floating Rocket Graphic from official assets */}
            <div className="absolute -top-12 -right-8 w-28 h-28 sm:w-36 sm:h-36 z-20 pointer-events-none drop-shadow-md">
              <Image
                src="/assets/rocket.png"
                alt="TechNeeds Rocket"
                width={140}
                height={140}
                className="object-contain"
                priority
              />
            </div>

            {/* Floating Badge Chip 1 */}
            <div className="absolute -left-6 top-10 z-20 hidden sm:flex items-center gap-2 bg-[var(--color-emptiness)] border border-[var(--color-spotted-dove)] rounded-xl px-3.5 py-2 shadow-sm">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-night-white)] text-[var(--color-caviar)] flex items-center justify-center font-bold text-xs border border-[var(--color-spotted-dove)]">
                C++
              </div>
              <div className="text-left">
                <div className="text-[11px] font-bold text-[var(--color-caviar)]">DSA Cohort Live</div>
                <div className="text-[9px] text-[var(--color-iron-fixture)]">By Shefali Kaushal</div>
              </div>
            </div>

            {/* Floating Badge Chip 2 */}
            <div className="absolute -right-4 bottom-8 z-20 hidden sm:flex items-center gap-2 bg-[var(--color-emptiness)] border border-[var(--color-spotted-dove)] rounded-xl px-3.5 py-2 shadow-sm">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-caviar)] text-[var(--color-emptiness)] flex items-center justify-center font-bold text-xs">
                WEB
              </div>
              <div className="text-left">
                <div className="text-[11px] font-bold text-[var(--color-caviar)]">Full-Stack Dev</div>
                <div className="text-[9px] text-[var(--color-iron-fixture)]">By Vidusi Agarwal</div>
              </div>
            </div>

            {/* Terminal Window Card in Neutral Palette */}
            <div className="relative rounded-2xl border border-[var(--color-spotted-dove)] bg-[var(--color-emptiness)] shadow-md overflow-hidden">
              {/* Window Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-night-white)] border-b border-[var(--color-spotted-dove)]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--color-stone-haze)]" />
                  <div className="w-3 h-3 rounded-full bg-[var(--color-spotted-dove)]" />
                  <div className="w-3 h-3 rounded-full bg-[var(--color-iron-fixture)]" />
                  <span className="ml-2 text-xs font-mono text-[var(--color-iron-fixture)] flex items-center gap-1.5">
                    <IconTerminal className="w-3.5 h-3.5" />
                    techneeds-society-v2.ts
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("terminal")}
                    className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors ${
                      activeTab === "terminal"
                        ? "bg-[var(--color-caviar)] text-[var(--color-emptiness)]"
                        : "text-[var(--color-iron-fixture)] hover:text-[var(--color-caviar)]"
                    }`}
                  >
                    CLI
                  </button>
                  <button
                    onClick={() => setActiveTab("cohorts")}
                    className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors ${
                      activeTab === "cohorts"
                        ? "bg-[var(--color-caviar)] text-[var(--color-emptiness)]"
                        : "text-[var(--color-iron-fixture)] hover:text-[var(--color-caviar)]"
                    }`}
                  >
                    Tracks
                  </button>
                </div>
              </div>

              {/* Code / Terminal Content */}
              <div className="p-5 font-mono text-xs text-left leading-relaxed text-[var(--color-caviar)]">
                {activeTab === "terminal" ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-[var(--color-night-white)] p-2.5 rounded-lg border border-[var(--color-spotted-dove)]">
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--color-iron-fixture)] font-bold">$</span>
                        <span className="text-[var(--color-caviar)]">npx create-techneeds-app@latest</span>
                      </div>
                      <button
                        onClick={copyCommand}
                        className="text-[var(--color-iron-fixture)] hover:text-[var(--color-caviar)] p-1 rounded"
                        title="Copy command"
                      >
                        {copied ? (
                          <IconCheck className="w-3.5 h-3.5 text-[var(--color-caviar)]" />
                        ) : (
                          <IconCopy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="space-y-1 text-[var(--color-iron-fixture)]">
                      <p className="text-[var(--color-caviar)] font-semibold">✔ Initializing TechNeeds IGDTUW workspace...</p>
                      <p>
                        → Community: <span className="text-[var(--color-caviar)]">Indira Gandhi DTUW</span>
                      </p>
                      <p>
                        → Active Mentees: <span className="text-[var(--color-caviar)]">1,200+ trained</span>
                      </p>
                      <p>
                        → Flagship Events: <span className="text-[var(--color-caviar)] font-medium">Hackathons & Speaker Sessions</span>
                      </p>
                      <p>
                        → Status: <span className="text-[var(--color-caviar)] font-semibold">Cohort Admissions Open</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[var(--color-night-white)]">
                      <div className="text-[11px] text-[var(--color-stone-haze)]">
                        {/* Ready to elevate your tech stack */}
                      </div>
                      <div className="text-[var(--color-iron-fixture)]">
                        const <span className="text-[var(--color-caviar)] font-bold">futureDev</span> = await
                        techneeds.<span className="text-[var(--color-stone-haze)] font-semibold">joinCohort</span>({`{`}
                      </div>
                      <div className="pl-4 text-[var(--color-iron-fixture)]">
                        branch: <span className="text-[var(--color-caviar)]">&quot;CSE / IT / ECE&quot;</span>,
                      </div>
                      <div className="pl-4 text-[var(--color-iron-fixture)]">
                        goal: <span className="text-[var(--color-caviar)]">&quot;Crack Top Tech & Hackathons&quot;</span>
                      </div>
                      <div className="text-[var(--color-iron-fixture)]">{`}`});</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-[var(--color-stone-haze)] text-[11px]">
                      {/* Live tracks and upcoming bootcamps */}
                    </div>
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-lg bg-[var(--color-night-white)] border border-[var(--color-spotted-dove)] flex items-center justify-between">
                        <div>
                          <div className="text-[var(--color-caviar)] font-bold">Web Development Cohort</div>
                          <div className="text-[var(--color-iron-fixture)] text-[10px]">React, Next.js, Node.js, API Design</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--color-caviar)] text-[var(--color-emptiness)]">
                          Active
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[var(--color-night-white)] border border-[var(--color-spotted-dove)] flex items-center justify-between">
                        <div>
                          <div className="text-[var(--color-caviar)] font-bold">DSA in C/C++ Cohort</div>
                          <div className="text-[var(--color-iron-fixture)] text-[10px]">Recursion, Trees, Graphs, DP</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--color-caviar)] text-[var(--color-emptiness)]">
                          Active
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[var(--color-night-white)] border border-[var(--color-spotted-dove)] flex items-center justify-between">
                        <div>
                          <div className="text-[var(--color-caviar)] font-bold">Community Hackathons</div>
                          <div className="text-[var(--color-iron-fixture)] text-[10px]">Build Sprints & Mentor-Led Tracks</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--color-stone-haze)] text-[var(--color-emptiness)]">
                          Upcoming
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Window Footer Status */}
              <div className="px-4 py-2 bg-[var(--color-night-white)] border-t border-[var(--color-spotted-dove)] flex items-center justify-between text-[11px] text-[var(--color-iron-fixture)]">
                <div className="flex items-center gap-2">
                  <IconCode className="w-3.5 h-3.5 text-[var(--color-iron-fixture)]" />
                  <span>IGDTUW Delhi Campus</span>
                </div>
                <span className="text-[var(--color-caviar)] font-semibold flex items-center gap-1">
                  ● 2025-2026 Batch
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
