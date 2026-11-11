"use client";

import TeamLanyardRail from "@/components/ui/team-lanyard-rail";
import type { LanyardMember } from "@/components/ui/team-lanyard-rail";

export const LANYARD_DEMO_TEAM: LanyardMember[] = [
  {
    id: "ada",
    name: "Ada Lindqvist",
    role: "Head of Design",
    team: "Acme · Design",
    tone: 1,
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80&auto=format&fit=crop",
    bio: "Turns fuzzy product ideas into calm, honest interfaces. Runs the Friday design crit.",
    tags: ["Design systems", "Since 2019"],
    links: [
      { label: "Email", href: "#" },
      { label: "Portfolio", href: "#" },
    ],
  },
  {
    id: "ravi",
    name: "Ravi Menon",
    role: "Engineering Lead",
    team: "Acme · Platform",
    tone: 2,
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80&auto=format&fit=crop",
    bio: "Keeps the build green and the on-call quiet. Happiest deleting old code.",
    tags: ["Platform", "Rust", "Since 2020"],
    links: [
      { label: "Email", href: "#" },
      { label: "Calendar", href: "#" },
    ],
  },
  {
    id: "imani",
    name: "Imani Okafor",
    role: "Product Manager",
    team: "Acme · Product",
    tone: 3,
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80&auto=format&fit=crop",
    bio: "Talks to five customers a week and writes the one-page plan everyone actually reads.",
    tags: ["Research", "Since 2021"],
    links: [
      { label: "Email", href: "#" },
      { label: "Notes", href: "#" },
    ],
  },
  {
    id: "kenji",
    name: "Kenji Arata",
    role: "iOS Engineer",
    team: "Acme · Mobile",
    tone: 4,
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80&auto=format&fit=crop",
    bio: "Sweats the last 10% of every animation. Ships the app with a 99.9% crash-free rate.",
    tags: ["Swift", "Motion", "Since 2022"],
    links: [
      { label: "Email", href: "#" },
      { label: "Portfolio", href: "#" },
    ],
  },
  {
    id: "lucia",
    name: "Lucia Ferreira",
    role: "People & Culture",
    team: "Acme · People",
    tone: 5,
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80&auto=format&fit=crop",
    bio: "Hires kind, curious people and makes sure their first week feels like a welcome.",
    tags: ["Hiring", "Since 2018"],
    links: [
      { label: "Email", href: "#" },
      { label: "Open roles", href: "#" },
    ],
  },
  {
    id: "mateo",
    name: "Mateo Ruiz",
    role: "Backend Engineer",
    team: "Acme · Platform",
    tone: 2,
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&auto=format&fit=crop",
    bio: "Designs the APIs other teams love to call. Writes the docs before the code.",
    tags: ["APIs", "Go", "Since 2021"],
    links: [
      { label: "Email", href: "#" },
      { label: "Calendar", href: "#" },
    ],
  },
  {
    id: "mila",
    name: "Mila Novak",
    role: "Brand Designer",
    team: "Acme · Design",
    tone: 1,
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80&auto=format&fit=crop",
    bio: "Draws the illustrations, picks the type and guards the brand from clip art.",
    tags: ["Illustration", "Since 2023"],
    links: [
      { label: "Email", href: "#" },
      { label: "Portfolio", href: "#" },
    ],
  },
  {
    id: "noah",
    name: "Noah Mensah",
    role: "Customer Success",
    team: "Acme · Support",
    tone: 3,
    image:
      "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=400&q=80&auto=format&fit=crop",
    bio: "Answers within the hour and turns every tricky ticket into a help-center article.",
    tags: ["Support", "Since 2020"],
    links: [
      { label: "Email", href: "#" },
      { label: "Calendar", href: "#" },
    ],
  },
];

export default function TeamLanyardRailDemo({
  autoplay = true,
}: {
  autoplay?: boolean;
}) {
  return (
    <div
      data-lanyard-demo
      className="flex min-h-svh w-full items-center justify-center bg-background text-foreground"
    >
      <TeamLanyardRail
        items={LANYARD_DEMO_TEAM}
        eyebrow="Meet the team · Eight people"
        heading="A team wall you can flip through, right on the page."
        caption="Brush along the rail to meet someone, pull a badge down, click to flip it."
        autoplay={autoplay}
        action={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-sm outline-none transition-[transform,box-shadow] hover:-translate-y-px hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
          >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-chart-2" />
            We&apos;re hiring
          </button>
        }
      />
    </div>
  );
}
