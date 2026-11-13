"use client";

import React from "react";
import Image from "next/image";
import {
  IconCode,
  IconTrophy,
  IconMicrophone,
  IconUsersGroup,
} from "@tabler/icons-react";

export default function Mission() {
  const offerings = [
    {
      title: "Curated Learning Tracks",
      description:
        "Learning paths put together by seniors, so you know what to study next instead of guessing between tutorials.",
      icon: <IconCode className="w-6 h-6" />,
      accent: "var(--color-plum-bright)",
      tag: "Curriculum",
    },
    {
      title: "Hackathons & Events",
      description:
        "Hackathons, coding contests and workshops on campus, with seniors around to help when you get stuck.",
      icon: <IconTrophy className="w-6 h-6" />,
      accent: "var(--color-gold-deep)",
      tag: "Competition",
    },
    {
      title: "Speaker Sessions",
      description:
        "Engineers, founders and alumnae talk about their work and answer your questions.",
      icon: <IconMicrophone className="w-6 h-6" />,
      accent: "var(--color-gain)",
      tag: "Networking",
    },
    {
      title: "Peer Community",
      description:
        "Study groups, finding a team for a hackathon, and DSA discussions with students from every year.",
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
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--color-caviar)] tracking-tight">
                Empowering every woman engineer at IGDTUW to{" "}
                <span className="text-[var(--color-plum-bright)]">
                  lead the tech revolution.
                </span>
              </h2>
              <p className="text-[var(--color-iron-fixture)] text-sm sm:text-base leading-relaxed max-w-2xl">
                We want to be where IGDTUW students come to learn how software is built: from seniors
                who were in their place a year or two ago, at their own pace, with people to ask along
                the way.
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
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-caviar)] tracking-tight">
              What We Offer
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {offerings.map((item, idx) => (
              <div
                key={idx}
                style={{ "--accent": item.accent } as React.CSSProperties}
                className="group relative overflow-hidden rounded-2xl p-6 bg-[var(--color-emptiness)] border border-[var(--color-spotted-dove)] hover:border-[var(--accent)] transition-[translate,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between"
              >
                {/* A thin line of the card's colour along the top. */}
                <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-[var(--accent)]" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl text-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,var(--color-emptiness))] border border-[color-mix(in_srgb,var(--accent)_30%,var(--color-emptiness))] flex items-center justify-center transition-transform group-hover:scale-105">
                      {item.icon}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded text-[color-mix(in_srgb,var(--accent)_50%,var(--color-caviar))] bg-[color-mix(in_srgb,var(--accent)_10%,var(--color-emptiness))] border border-[color-mix(in_srgb,var(--accent)_25%,var(--color-emptiness))]">
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
