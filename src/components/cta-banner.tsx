"use client";

import React from "react";
import {
  IconBrandWhatsapp,
  IconRocket,
} from "@tabler/icons-react";

export default function CtaBanner() {
  return (
    <section className="py-20 relative bg-[var(--color-emptiness)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl p-8 sm:p-14 bg-[var(--color-caviar)] text-[var(--color-emptiness)] border border-[var(--color-caviar)] shadow-xl overflow-hidden text-center">
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[var(--color-emptiness)]/10 text-[var(--color-night-white)] border border-[var(--color-spotted-dove)]/30">
              <span>Take Your Engineering Journey To The Next Level</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--color-emptiness)] tracking-tight leading-tight">
              Ready to Upgrade Yourself? <br />
              <span className="text-[var(--color-spotted-dove)]">
                Join the TechNeeds IGDTUW Movement.
              </span>
            </h2>

            <p className="text-[var(--color-night-white)] text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
              Whether you are preparing for your first hackathon, diving into Data Structures, or
              building full-stack applications, there is a community of ambitious women ready to code
              with you.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://chat.whatsapp.com/invite/techneeds"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold text-[var(--color-caviar)] bg-[var(--color-emptiness)] hover:bg-[var(--color-night-white)] shadow-md transition-all hover:scale-105"
              >
                <IconBrandWhatsapp className="w-5 h-5 text-[var(--color-caviar)]" />
                <span>Join Official WhatsApp Group</span>
              </a>

              <a
                href="#cohorts"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-[var(--color-emptiness)] bg-[var(--color-iron-fixture)] hover:bg-[var(--color-stone-haze)] border border-[var(--color-stone-haze)] transition-all hover:scale-105"
              >
                <IconRocket className="w-5 h-5" />
                <span>Explore Cohort Admissions</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
