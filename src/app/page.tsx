"use client";

import {
  LandingNav,
  HeroSection,
  SpeedSection,
  CompeteSection,
  EarlyPlayersSection,
  ThemesSection,
  FinalCTASection,
  Footer,
} from "@/components/landing";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {/* Global Noise Overlay - covers the entire page */}
      <div
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          backgroundImage: `url("/noise.svg")`,
          backgroundRepeat: "repeat",
          opacity: 0.5,
        }}
        aria-hidden="true"
      />

      {/* Navigation - fixed at top */}
      <LandingNav />

      {/* Hero Section - Dark gradient */}
      <HeroSection />

      {/* Speed, Memory, Intuition - Yellow */}
      <SpeedSection />

      {/* Compete for the biggest prize pool - Green */}
      <CompeteSection />

      {/* Early Players Win Twice - Pink/Magenta */}
      <EarlyPlayersSection />

      {/* Weekly Themes - Blue gradient */}
      <ThemesSection />

      {/* Final CTA - Gold gradient */}
      <FinalCTASection />

      {/* Footer - Dark */}
      <Footer />
    </main>
  );
}

