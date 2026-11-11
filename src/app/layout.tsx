import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LoadingScreen } from "@/components/loading-screen";
import { SmoothCursor } from "@/components/ui/smooth-cursor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TechNeeds IGDTUW | Empowering Women in Tech",
  description:
    "Official portal of TechNeeds IGDTUW. Mentorship Cohorts, Hackathons, Tech Talks, and thriving developer community.",
  icons: {
    icon: "/assets/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--color-emptiness)] text-[var(--color-caviar)] selection:bg-[var(--color-caviar)] selection:text-[var(--color-emptiness)]">
        {/* The overlay lives in the layout, which persists across client-side
            navigations. That way it plays once on a hard load and never
            remounts when the user moves between pages. */}
        <LoadingScreen />
        {children}
        {/* Last, so it is drawn over the loading screen. */}
        <SmoothCursor />
      </body>
    </html>
  );
}
