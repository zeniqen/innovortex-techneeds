"use client";

import React from "react";
import { PageReveal } from "@/components/ui/page-reveal";
import FAQs from "@/components/ui/text-reveal-faqs";

export default function FaqPage() {
  return (
    <section id="faq" className="relative bg-[var(--color-emptiness)]">
      {/* Revealed top to bottom on route changes */}
      <PageReveal>
        <FAQs headingLevel="h1" title="Frequently Asked Questions" />
      </PageReveal>
    </section>
  );
}
