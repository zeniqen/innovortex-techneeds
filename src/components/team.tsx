"use client";

import { IconUsersGroup } from "@tabler/icons-react";
import { PageReveal } from "@/components/ui/page-reveal";
import {
  TeamLanyardRail,
  type LanyardLink,
  type LanyardMember,
} from "@/components/ui/team-lanyard-rail";
import { TEAM_GROUPS } from "@/lib/team-data";

function linksFor(member: (typeof TEAM_GROUPS)[number]["members"][number]) {
  const links: LanyardLink[] = [];

  if (member.links.linkedin) {
    links.push({ label: "LinkedIn", href: member.links.linkedin });
  }
  if (member.links.instagram) {
    links.push({ label: "Instagram", href: member.links.instagram });
  }
  if (member.links.x) {
    links.push({ label: "X", href: member.links.x });
  }

  return links;
}

export default function Team() {
  return (
    <section id="team" className="relative py-24 bg-[var(--color-emptiness)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageReveal>
          {/* Page Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-night-white)] text-[var(--color-caviar)] border border-[var(--color-spotted-dove)]">
              <IconUsersGroup className="w-3.5 h-3.5 text-[var(--color-iron-fixture)]" />
              <span>Who We Are</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-caviar)]">
              Meet Our Team
            </h1>
            <p className="text-[var(--color-iron-fixture)] text-sm sm:text-base leading-relaxed">
              The students behind TechNeeds IGDTUW — a society built by people
              who wanted the next generation to start further ahead.
            </p>
          </div>
        </PageReveal>

        {/* One lanyard rail per group of the society */}
        {TEAM_GROUPS.map((group) => {
          const items: LanyardMember[] = group.members.map((member, index) => ({
            id: `${group.role}-${member.name}-${index}`,
            name: member.name,
            role: member.position,
            team: group.role,
            image: member.avatar,
            links: linksFor(member),
            tone: ((index % 5) + 1) as 1 | 2 | 3 | 4 | 5,
          }));

          return (
            <TeamLanyardRail
              key={group.role}
              items={items}
              eyebrow={`${group.members.length} ${
                group.members.length === 1 ? "member" : "members"
              }`}
              heading={group.role}
              caption="Click a badge to turn it over, or drag one along the rail."
              className="mb-16 last:mb-0"
            />
          );
        })}
      </div>
    </section>
  );
}
