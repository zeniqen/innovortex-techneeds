"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  IconBrandWhatsapp,
  IconHelpCircle,
  IconMail,
} from "@tabler/icons-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * How long the whole reveal takes, whatever the length of the answer.
 *
 * The upstream version staggers every character by a fixed 15ms, which reads
 * well for a one-line caption but stretches to several seconds for a
 * paragraph. The stagger here is derived from the character count instead,
 * so a long answer resolves in the same time a short one does.
 *
 * The per-character animation itself lives in `globals.css` as
 * `.faq-reveal-letter`: a CSS animation costs the main thread nothing per
 * frame, where driving 200 characters from JavaScript costs a visible hitch
 * every time an answer is opened.
 */
const REVEAL_SECONDS = 0.9;
/**
 * The longest gap between two consecutive characters.
 */
const MAX_STAGGER = 0.015;
/**
 * How long the paragraph as a whole takes to fade in.
 */
const FADE_DURATION = 0.25;

const faqItems = [
  {
    id: "what-is-techneeds",
    question: "What is TechNeeds?",
    answer:
      "TechNeeds is a student-led technology community at IGDTUW, founded in 2023. We nurture curious beginners into hackathon champions and skilled software engineers, with a core mission of empowering every woman engineer at IGDTUW to lead the tech revolution.",
  },
  {
    id: "what-we-offer",
    question: "What do you offer?",
    answer:
      "Curated learning tracks built by seniors who cracked top internships, flagship 24-hour hackathons with live mentor desks, speaker sessions and industry AMAs, cohort-based mentorship, tech introductory sessions, the tech engagement competition, and a peer community with study rooms and help desks.",
  },
  {
    id: "mentorship",
    question: "How does the mentorship work?",
    answer:
      "Our cohorts are led by proven seniors and top alumnae. You get a clear roadmap, code reviews and accountability, so your growth is measured against a plan rather than left to chance.",
  },
  {
    id: "who-can-join",
    question: "Who can join?",
    answer:
      "TechNeeds is built for IGDTUW students who want to understand, build and conquer the ever-evolving world of software development. If you are a beginner with curiosity, or a developer sharpening your edge, there is a track for you.",
  },
  {
    id: "contact-support",
    question: "How can I contact support?",
    answer:
      "Reach us on our official WhatsApp group, or email techneedsigdtuw@gmail.com. Our student coordinators answer both, and either route gets you to the right person fastest.",
  },
  {
    id: "track-journey",
    question: "Can I track my mentorship journey?",
    answer:
      "Yes. Your progress is tracked through our online portal, so you can see where you started, what you have finished and what comes next.",
  },
  {
    id: "where",
    question: "Where is TechNeeds based?",
    answer:
      "We are based in the heart of IGDTUW, where the community, the hackathons and the mentorship sessions all happen.",
  },
];

/**
 * Reveals a string one character at a time, each character resolving out of
 * a blur.
 *
 * The blur lives on the letters themselves rather than on a container: a
 * single blurred paragraph would resolve all at once and lose the wave that
 * makes the effect read as handwriting appearing rather than a fade.
 *
 * Letters are grouped into words. Every character is an inline block, and
 * inline blocks are atomic - the browser is free to break the line between
 * any two of them, which is how "We nurture" ends up as "We n / urture".
 * Wrapping each word in a nowrap span keeps the line breaks where a reader
 * expects them.
 */
export const BlurredStagger = ({
  text = "built by ruixen.com",
}: {
  text: string;
}) => {
  const reduceMotion = useReducedMotion();
  const words = text.split(" ");
  const stagger = Math.min(
    MAX_STAGGER,
    REVEAL_SECONDS / Math.max(1, text.length),
  );

  // The character index of the first character of each word, so the reveal
  // runs across the whole answer rather than restarting at every word.
  const offsets = words.map((_, index) =>
    words.slice(0, index).reduce((total, word) => total + word.length, 0),
  );

  return (
    <div className="w-full">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : FADE_DURATION }}
        className="text-base leading-relaxed break-words whitespace-normal"
      >
        {words.map((word, wordIndex) => (
          <React.Fragment key={wordIndex}>
            <span className="inline-block whitespace-nowrap">
              {word.split("").map((char, charIndex) => (
                <span
                  key={charIndex}
                  className="faq-reveal-letter inline-block"
                  style={{
                    animationDelay: `${(offsets[wordIndex] + charIndex) * stagger}s`,
                  }}
                >
                  {char}
                </span>
              ))}
            </span>
            {wordIndex < words.length - 1 ? " " : null}
          </React.Fragment>
        ))}
      </motion.p>
    </div>
  );
};

export default function FAQs({
  headingLevel: Heading = "h2",
  title = "FAQs",
  subtitle = "Everything you need to know about TechNeeds IGDTUW, our services, and how to reach us.",
}: {
  /** the heading level of the title, so a page can pass "h1" */
  headingLevel?: "h1" | "h2";
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 md:grid-cols-5 md:gap-12">
          <div className="md:col-span-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-spotted-dove)] bg-[var(--color-night-white)] px-3 py-1 text-xs font-semibold text-[var(--color-caviar)]">
              <IconHelpCircle className="h-3.5 w-3.5 text-[var(--color-iron-fixture)]" />
              <span>Got Questions?</span>
            </div>
            <Heading className="mt-5 text-4xl font-extrabold tracking-tight text-foreground">
              {title}
            </Heading>
            <p className="mt-4 text-balance text-lg leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
            <p className="mt-6 hidden text-sm leading-relaxed text-muted-foreground md:block">
              Can’t find what you’re looking for? Reach out to our student
              coordinators directly.
            </p>
            <div className="mt-4 hidden flex-wrap items-center gap-2 md:flex">
              <a
                href="https://chat.whatsapp.com/invite/techneeds"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-spotted-dove)] bg-[var(--color-emptiness)] px-3.5 py-2 text-xs font-semibold text-[var(--color-caviar)] transition-colors hover:bg-[var(--color-night-white)]"
              >
                <IconBrandWhatsapp className="h-4 w-4" />
                WhatsApp
              </a>
              <a
                href="mailto:techneedsigdtuw@gmail.com"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-spotted-dove)] bg-[var(--color-emptiness)] px-3.5 py-2 text-xs font-semibold text-[var(--color-caviar)] transition-colors hover:bg-[var(--color-night-white)]"
              >
                <IconMail className="h-4 w-4" />
                Email us
              </a>
            </div>
          </div>

          <div className="md:col-span-3">
            <Accordion type="single" collapsible>
              {faqItems.map((item) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="border-b border-border"
                >
                  <AccordionTrigger className="cursor-pointer text-base font-medium hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <BlurredStagger text={item.answer} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <p className="text-sm text-muted-foreground md:hidden">
            Can’t find what you’re looking for?{" "}
            <a
              href="mailto:techneedsigdtuw@gmail.com"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Email our coordinators
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
