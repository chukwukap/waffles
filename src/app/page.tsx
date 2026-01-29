"use client";

import {
  LandingNav,
  HeroSection,
  SpeedSection,
  CompeteSection,
  EarlyPlayersSection,
  ThemesSection,
  FinalCTASection,
  FAQSection,
  Footer,
} from "@/components/landing";
import { SmoothScrollProvider } from "@/components/landing/SmoothScrollProvider";
import { CustomCursor } from "@/components/landing/CustomCursor";
import { ScrollProgress } from "@/components/landing/ScrollProgress";

export default function Home() {
  return (
    <SmoothScrollProvider>
      {/* Custom Cursor - Desktop only */}
      <CustomCursor />

      {/* Scroll Progress Indicator */}
      <ScrollProgress />

      <main className="relative min-h-screen overflow-x-hidden">

        {/* Navigation - fixed at top */}
        <LandingNav />

        {/* Hero Section - Dark gradient */}
        <HeroSection />

        {/* Speed, Memory, Intuition - Yellow */}
        <SpeedSection />

        {/* Compete for the biggest prize pool - Green */}
        <CompeteSection />

        {/* Early Players Win Twice - Cyan */}
        <EarlyPlayersSection />

        {/* Weekly Themes - Purple gradient */}
        <ThemesSection />

        {/* Final CTA - Gold */}
        <FinalCTASection />

        {/* FAQ Section - Dark */}
        <FAQSection />

        {/* Footer - Dark */}
        <Footer />
      </main>
    </SmoothScrollProvider>
  );
}
