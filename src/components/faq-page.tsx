"use client";

import React, { useState } from "react";
import {
  IconHelpCircle,
  IconChevronDown,
  IconBrandWhatsapp,
  IconMail,
} from "@tabler/icons-react";
import { PageReveal } from "@/components/ui/page-reveal";

const faqs = [
  {
    q: "What is TechNeeds?",
    a: "TechNeeds is a platform that provides technology solutions and support for various needs.",
  },
  {
    q: "How can I contact support?",
    a: "You can contact support via our official WhatsApp group or email us at techneedsigdtuw@gmail.com.",
  },
  {
    q: "What services do you offer?",
    a: "We offer a range of services including hackathon, tech introductory sessions, mentorship programs, tech engagement competition and speaker sessions.",
  },
  {
    q: "Where is TechNeeds located?",
    a: "TechNeeds is based in the heart of IGDTUW founded in 2023.",
  },
  {
    q: "Can I track my mentorship journey?",
    a: "Yes, you can track your journey through our online portal.",
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-24 relative bg-[var(--color-emptiness)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Revealed top to bottom on route changes */}
        <PageReveal>
          {/* Page Header */}
          <div className="text-center mb-14 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-night-white)] text-[var(--color-caviar)] border border-[var(--color-spotted-dove)]">
              <IconHelpCircle className="w-3.5 h-3.5 text-[var(--color-iron-fixture)]" />
              <span>Got Questions?</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-caviar)]">
              Frequently Asked Questions
            </h1>
            <p className="text-[var(--color-iron-fixture)] text-sm sm:text-base leading-relaxed">
              Everything you need to know about TechNeeds IGDTUW, our services, and how to reach us.
            </p>
          </div>

          {/* Accordion List */}
          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isOpen
                      ? "bg-[var(--color-emptiness)] border-[var(--color-caviar)] shadow-md"
                      : "bg-[var(--color-emptiness)] border-[var(--color-spotted-dove)] hover:border-[var(--color-stone-haze)]"
                  }`}
                >
                  <button
                    onClick={() => toggle(idx)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base sm:text-lg font-bold text-[var(--color-caviar)]">
                      {faq.q}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                        isOpen
                          ? "rotate-180 bg-[var(--color-caviar)] text-[var(--color-emptiness)]"
                          : "bg-[var(--color-night-white)] text-[var(--color-iron-fixture)]"
                      }`}
                    >
                      <IconChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-1 text-sm text-[var(--color-iron-fixture)] leading-relaxed border-t border-[var(--color-night-white)]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Additional Help CTA */}
          <div className="mt-12 text-center p-6 rounded-2xl bg-[var(--color-emptiness)] border border-[var(--color-spotted-dove)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <h2 className="text-sm font-bold text-[var(--color-caviar)]">Still have questions?</h2>
              <p className="text-xs text-[var(--color-iron-fixture)]">
                Reach out to our student coordinators directly on WhatsApp or Email.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://chat.whatsapp.com/invite/techneeds"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[var(--color-emptiness)] bg-[var(--color-caviar)] hover:bg-[var(--color-iron-fixture)] transition-colors"
              >
                <IconBrandWhatsapp className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
              <a
                href="mailto:techneedsigdtuw@gmail.com"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[var(--color-caviar)] bg-[var(--color-night-white)] border border-[var(--color-spotted-dove)] hover:bg-[var(--color-spotted-dove)]/40 transition-colors"
              >
                <IconMail className="w-4 h-4" />
                <span>Email Us</span>
              </a>
            </div>
          </div>
        </PageReveal>
      </div>
    </section>
  );
}
