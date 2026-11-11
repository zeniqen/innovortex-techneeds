"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { FloatingDock } from "@/components/ui/floating-dock";
import {
  IconHome,
  IconCpu,
  IconUsers,
  IconTrophy,
  IconHelpCircle,
  IconUserCircle,
} from "@tabler/icons-react";

export default function FloatingDockDemo() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const links = [
    {
      // On the home page this scrolls back to the top, elsewhere it navigates home.
      title: "Home",
      icon: <IconHome className="h-full w-full" />,
      href: isHome ? "#home" : "/",
    },
    {
      title: "Techboard",
      icon: <IconCpu className="h-full w-full" />,
      href: "/techboard",
    },
    {
      title: "Team",
      icon: <IconUsers className="h-full w-full" />,
    },
    {
      title: "Leaderboard",
      icon: <IconTrophy className="h-full w-full" />,
      href: "/leaderboard",
    },
    {
      title: "FAQs",
      icon: <IconHelpCircle className="h-full w-full" />,
      href: "/faq",
    },
    {
      title: "Profile",
      icon: <IconUserCircle className="h-full w-full" />,
    },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <FloatingDock items={links} />
    </div>
  );
}
