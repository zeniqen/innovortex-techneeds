"use client";

import Image from "next/image";
import {
  IconBrandLinkedin,
  IconBrandInstagram,
  IconBrandX,
  IconUsersGroup,
} from "@tabler/icons-react";
import { PageReveal } from "@/components/ui/page-reveal";
import { TEAM_GROUPS, type TeamMember } from "@/lib/team-data";

const SOCIAL_ICONS = {
  linkedin: IconBrandLinkedin,
  instagram: IconBrandInstagram,
  x: IconBrandX,
} as const;

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

          {/* Team groups */}
          {TEAM_GROUPS.map((group) => (
            <div key={group.role} className="mb-16 last:mb-0">
              <div className="flex items-center justify-center gap-3 mb-10">
                <span className="h-px w-8 bg-[var(--color-spotted-dove)]" />
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--color-plum)]">
                  {group.role}
                </h2>
                <span className="h-px w-8 bg-[var(--color-spotted-dove)]" />
              </div>

              {/* The row gap has to clear the portraits, which overhang the
                  top of their card. */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-14 sm:gap-x-6">
                {group.members.map((member) => (
                  <MemberCard key={`${group.role}-${member.name}`} member={member} />
                ))}
              </div>
            </div>
          ))}
        </PageReveal>
      </div>
    </section>
  );
}

function MemberCard({ member }: { member: TeamMember }) {
  const socials = Object.entries(member.links).filter(
    (entry): entry is [keyof typeof SOCIAL_ICONS, string] => Boolean(entry[1]),
  );

  return (
    <div className="group relative flex flex-col items-center rounded-2xl border border-[var(--color-spotted-dove)] bg-[var(--color-emptiness)] px-5 pb-6 pt-16 text-center shadow-sm transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 hover:shadow-md">
      {/* Portrait, overlapping the top of the card */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2">
        <Image
          src={member.avatar}
          alt={`${member.name}, ${member.position}`}
          width={200}
          height={200}
          sizes="(max-width: 640px) 40vw, (max-width: 1024px) 30vw, 200px"
          className="size-24 sm:size-28 rounded-full border-4 border-[var(--color-emptiness)] object-cover shadow-sm"
        />
      </div>

      <h3 className="text-sm sm:text-base font-bold text-[var(--color-caviar)]">
        {member.name}
      </h3>
      <p className="mt-1 text-xs font-semibold text-[var(--color-iron-fixture)]">
        {member.position}
      </p>

      {socials.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          {socials.map(([network, href]) => {
            const Icon = SOCIAL_ICONS[network];

            return (
              <a
                key={network}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`${member.name} on ${network}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-night-white)] text-[var(--color-iron-fixture)] transition-colors duration-150 hover:bg-[var(--color-plum)] hover:text-[var(--color-emptiness)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-plum)]"
              >
                <Icon className="w-4 h-4" />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
