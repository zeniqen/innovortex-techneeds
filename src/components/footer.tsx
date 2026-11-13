"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  IconBrandGithub,
  IconBrandLinkedin,
  IconBrandWhatsapp,
  IconBrandX,
  IconMail,
  IconPhone,
  IconMapPin,
  IconHeart,
} from "@tabler/icons-react";

import { PalettePicker } from "./palette-picker";

export default function Footer() {
  return (
    <footer className="relative bg-[var(--color-night-white)]/40 border-t border-[var(--color-night-white)] pt-16 pb-28 text-[var(--color-iron-fixture)] text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-[var(--color-spotted-dove)]/60">
          {/* Brand Info */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-[var(--color-emptiness)] border border-[var(--color-spotted-dove)] p-1">
                <Image
                  src="/assets/logo.png"
                  alt="TechNeeds Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <span className="text-lg font-bold text-[var(--color-caviar)] tracking-tight flex items-center gap-1.5">
                  TechNeeds <span className="text-[var(--color-iron-fixture)] font-semibold">IGDTUW</span>
                </span>
                <p className="text-[11px] text-[var(--color-iron-fixture)]">
                  Indira Gandhi Delhi Technical University for Women
                </p>
              </div>
            </div>

            <p className="text-[var(--color-iron-fixture)] text-xs leading-relaxed max-w-sm">
              TechNeeds IGDTUW is a student community that fosters a motive of{" "}
              <strong className="text-[var(--color-caviar)]">&ldquo;all_you_need_to_know_about_tech&rdquo;</strong>. We offer
              hands-on mentorship programs, community hackathons, and a competitive peer
              environment to build and excel together.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-2 pt-2">
              <a
                href="https://github.com/techneeds-igdtuw"
                target="_blank"
                rel="noreferrer noopener"
                className="w-9 h-9 rounded-xl bg-[var(--color-emptiness)] border border-[var(--color-spotted-dove)] flex items-center justify-center text-[var(--color-iron-fixture)] hover:text-[var(--color-caviar)] hover:border-[var(--color-caviar)] transition-colors"
                aria-label="GitHub"
              >
                <IconBrandGithub className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com/company/techneeds-igdtuw"
                target="_blank"
                rel="noreferrer noopener"
                className="w-9 h-9 rounded-xl bg-[var(--color-emptiness)] border border-[var(--color-spotted-dove)] flex items-center justify-center text-[var(--color-iron-fixture)] hover:text-[var(--color-caviar)] hover:border-[var(--color-caviar)] transition-colors"
                aria-label="LinkedIn"
              >
                <IconBrandLinkedin className="w-4 h-4" />
              </a>
              <a
                href="https://chat.whatsapp.com/invite/techneeds"
                target="_blank"
                rel="noreferrer noopener"
                className="w-9 h-9 rounded-xl bg-[var(--color-emptiness)] border border-[var(--color-spotted-dove)] flex items-center justify-center text-[var(--color-iron-fixture)] hover:text-[var(--color-caviar)] hover:border-[var(--color-caviar)] transition-colors"
                aria-label="WhatsApp"
              >
                <IconBrandWhatsapp className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer noopener"
                className="w-9 h-9 rounded-xl bg-[var(--color-emptiness)] border border-[var(--color-spotted-dove)] flex items-center justify-center text-[var(--color-iron-fixture)] hover:text-[var(--color-caviar)] hover:border-[var(--color-caviar)] transition-colors"
                aria-label="Twitter / X"
              >
                <IconBrandX className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-[var(--color-caviar)] uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/#home" className="hover:text-[var(--color-caviar)] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-[var(--color-caviar)] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/#cohorts" className="hover:text-[var(--color-caviar)] transition-colors">
                  Mentorship Cohorts
                </Link>
              </li>
              <li>
                <Link href="/#glimpse" className="hover:text-[var(--color-caviar)] transition-colors">
                  Society Glimpse
                </Link>
              </li>
              <li>
                <Link href="/#testimonials" className="hover:text-[var(--color-caviar)] transition-colors">
                  Student Reviews
                </Link>
              </li>
            </ul>
          </div>

          {/* Cohorts & Programs */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-[var(--color-caviar)] uppercase tracking-wider">
              Programs
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/#cohorts" className="hover:text-[var(--color-caviar)] transition-colors">
                  Web Development
                </Link>
              </li>
              <li>
                <Link href="/#cohorts" className="hover:text-[var(--color-caviar)] transition-colors">
                  DSA in C/C++
                </Link>
              </li>
              <li>
                <Link href="/#cohorts" className="hover:text-[var(--color-caviar)] transition-colors">
                  AI & GenAI Masterclass
                </Link>
              </li>
              <li>
                <Link href="/#cohorts" className="hover:text-[var(--color-caviar)] transition-colors">
                  Open Source & Git
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-[var(--color-caviar)] transition-colors">
                  FAQs & Help Desk
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-[var(--color-caviar)] uppercase tracking-wider">
              Get in Touch
            </h4>
            <p className="text-xs text-[var(--color-iron-fixture)]">
              You can DM your query on our WhatsApp or mail us directly.
            </p>

            <div className="space-y-2 text-xs">
              <a
                href="mailto:techneedsigdtuw@gmail.com"
                className="flex items-center gap-2 hover:text-[var(--color-caviar)] transition-colors"
              >
                <IconMail className="w-4 h-4 text-[var(--color-caviar)] shrink-0" />
                <span>techneedsigdtuw@gmail.com</span>
              </a>

              <a
                href="tel:+918958898580"
                className="flex items-center gap-2 hover:text-[var(--color-caviar)] transition-colors"
              >
                <IconPhone className="w-4 h-4 text-[var(--color-caviar)] shrink-0" />
                <span>+91 8958898580</span>
              </a>

              <div className="flex items-start gap-2 text-[var(--color-iron-fixture)]">
                <IconMapPin className="w-4 h-4 text-[var(--color-stone-haze)] shrink-0 mt-0.5" />
                <span>IGDTUW Campus, Kashmere Gate, New Delhi - 110006</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-iron-fixture)]">
          <div className="flex items-center gap-4">
            <span>TechNeeds IGDTUW © 2025 All Rights Reserved.</span>
            <PalettePicker />
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-[var(--color-caviar)] transition-colors">
              Terms of Service
            </a>
            <span>•</span>
            <a href="#" className="hover:text-[var(--color-caviar)] transition-colors">
              Privacy Policy
            </a>
            <span>•</span>
            <span className="flex items-center gap-1">
              Crafted with <IconHeart className="w-3 h-3 text-[var(--color-caviar)] fill-[var(--color-caviar)]" /> for IGDTUW
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
