"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { IconSchool, IconUsersGroup, IconSparkles } from "@tabler/icons-react";
import { PageReveal } from "@/components/ui/page-reveal";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import { LoginModal, type LoginRole } from "@/components/ui/login-modal";

const WHATSAPP = "https://chat.whatsapp.com/invite/techneeds";

type Role = {
  title: string;
  hint: string;
  Icon: ComponentType<{ className?: string }>;
} & ({ kind: "login"; loginRole: LoginRole } | { kind: "link"; href: string });

const roles: Role[] = [
  {
    title: "Mentee",
    hint: "Sign in with your enrollment number.",
    kind: "login",
    loginRole: "mentee",
    Icon: IconSchool,
  },
  {
    title: "Mentor",
    hint: "Sign in with your email to reach the mentor dashboard.",
    kind: "login",
    loginRole: "mentor",
    Icon: IconUsersGroup,
  },
  {
    title: "New Person",
    hint: "See what life at TechNeeds looks like.",
    kind: "link",
    href: "/#glimpse",
    Icon: IconSparkles,
  },
];

export default function Techboard() {
  const [loginRole, setLoginRole] = useState<LoginRole | null>(null);

  return (
    <section
      id="techboard"
      className="relative flex min-h-[70vh] items-center justify-center overflow-hidden py-24 bg-[var(--color-emptiness)]"
    >
      {/* Ripple backdrop - click anywhere in the grid to send a ripple */}
      <BackgroundRippleEffect />

      <div className="relative z-10 w-full px-4 sm:px-6 flex justify-center">
        <div className="w-full max-w-[500px]">
          <PageReveal>
            <div className="bg-techboard-card rounded-2xl p-8 sm:p-10 text-center shadow-xl">
              <h1 className="text-2xl sm:text-[27px] font-extrabold tracking-tight text-balance text-[var(--color-caviar)] leading-tight">
                Oops, you are not associated with TechNeeds yet.
              </h1>
              <p className="mt-4 text-sm sm:text-base text-[var(--color-iron-fixture)]">
                Already Joined? / Want to Join?
              </p>

              <div className="mt-8 flex flex-col gap-3">
                {roles.map((role) => {
                  const { Icon } = role;
                  const className =
                    "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-caviar)] px-5 py-3 text-sm font-bold text-[var(--color-emptiness)] shadow-md transition-colors duration-150 hover:bg-[var(--color-iron-fixture)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-caviar)]";

                  const content = (
                    <>
                      <Icon className="w-5 h-5" />
                      <span>{role.title}</span>
                    </>
                  );

                  if (role.kind === "login") {
                    return (
                      <button
                        key={role.title}
                        type="button"
                        onClick={() => setLoginRole(role.loginRole)}
                        title={role.hint}
                        aria-label={`${role.title} - ${role.hint}`}
                        className={className}
                      >
                        {content}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={role.title}
                      href={role.href}
                      title={role.hint}
                      aria-label={`${role.title} - ${role.hint}`}
                      className={className}
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>

              <p className="mt-6 text-xs text-[var(--color-iron-fixture)]">
                Want to join the community right now?{" "}
                <a
                  href={WHATSAPP}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-semibold whitespace-nowrap text-[var(--color-caviar)] underline underline-offset-4 hover:text-[var(--color-iron-fixture)] transition-colors"
                >
                  Join our WhatsApp group
                </a>
                .
              </p>
            </div>
          </PageReveal>
        </div>
      </div>

      {/* Mentee / Mentor sign-in pop-up */}
      <LoginModal role={loginRole} onClose={() => setLoginRole(null)} />
    </section>
  );
}
