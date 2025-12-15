"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// Floating waffle with random animation
function FloatingWaffle({ delay, size, left }: { delay: number; size: number; left: string }) {
  return (
    <div
      className="absolute pointer-events-none opacity-20"
      style={{
        left,
        top: "-60px",
        animation: `float ${8 + delay}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      <Image
        src="/images/illustrations/waffles.svg"
        alt=""
        width={size}
        height={size}
        className="drop-shadow-2xl"
      />
    </div>
  );
}

// Animated stat counter
function AnimatedCounter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = end / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [end]);

  return <span>{count.toLocaleString()}{suffix}</span>;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-linear-to-br from-purple-900/30 via-black to-orange-900/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating waffles */}
      {mounted && (
        <>
          <FloatingWaffle delay={0} size={80} left="10%" />
          <FloatingWaffle delay={2} size={60} left="25%" />
          <FloatingWaffle delay={4} size={100} left="50%" />
          <FloatingWaffle delay={1} size={70} left="75%" />
          <FloatingWaffle delay={3} size={90} left="90%" />
        </>
      )}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        {/* Logo / Hero */}
        <div
          className={`transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
        >
          <div className="relative mb-8">
            <Image
              src="/images/illustrations/waffles.svg"
              alt="Waffles"
              width={200}
              height={120}
              priority
              className="drop-shadow-[0_0_60px_rgba(251,191,36,0.3)]"
            />
            {/* Glow effect */}
            <div className="absolute inset-0 blur-3xl bg-amber-500/20 -z-10" />
          </div>
        </div>

        {/* Title */}
        <h1
          className={`font-body text-5xl md:text-7xl font-bold text-center mb-4 transition-all duration-1000 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
        >
          <span className="bg-linear-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
            WAFFLES
          </span>
        </h1>

        {/* Tagline */}
        <p
          className={`text-xl md:text-2xl text-white/70 text-center max-w-md mb-12 font-display transition-all duration-1000 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
        >
          The ultimate trivia game on{" "}
          <span className="text-purple-400 font-semibold">Farcaster</span>.
          <br />
          Play. Compete. Win USDC.
        </p>

        {/* Stats */}
        <div
          className={`flex gap-8 md:gap-16 mb-12 transition-all duration-1000 delay-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
        >
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white font-body">
              <AnimatedCounter end={5000} suffix="+" />
            </div>
            <div className="text-sm text-white/50 font-display">Players</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-amber-400 font-body">
              $<AnimatedCounter end={50000} />
            </div>
            <div className="text-sm text-white/50 font-display">Won</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white font-body">
              <AnimatedCounter end={200} suffix="+" />
            </div>
            <div className="text-sm text-white/50 font-display">Games</div>
          </div>
        </div>

        {/* CTA Button */}
        <Link
          href="/game"
          className={`group relative px-10 py-4 rounded-full font-body text-lg font-bold transition-all duration-1000 delay-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
        >
          {/* Button glow */}
          <div className="absolute inset-0 bg-linear-to-r from-amber-500 to-orange-500 rounded-full blur-lg opacity-50 group-hover:opacity-80 transition-opacity" />
          {/* Button background */}
          <div className="absolute inset-0 bg-linear-to-r from-amber-500 to-orange-500 rounded-full" />
          {/* Button border */}
          <div className="absolute inset-[2px] bg-linear-to-r from-amber-400 to-orange-400 rounded-full" />
          {/* Button content */}
          <span className="relative text-black flex items-center gap-2">
            PLAY NOW
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </Link>

        {/* Features */}
        <div
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl transition-all duration-1000 delay-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
        >
          <FeatureCard
            icon="🎮"
            title="Real-Time Trivia"
            description="Answer fast, beat the clock, climb the leaderboard."
          />
          <FeatureCard
            icon="💰"
            title="Win Real Prizes"
            description="Top players split the prize pool. USDC paid instantly."
          />
          <FeatureCard
            icon="🎭"
            title="Social Gaming"
            description="Live chat, see friends playing, share your victories."
          />
        </div>

        {/* Footer */}
        <div
          className={`mt-20 text-center text-white/30 text-sm font-display transition-all duration-1000 delay-1000 ${mounted ? "opacity-100" : "opacity-0"
            }`}
        >
          Built on{" "}
          <span className="text-blue-400">Base</span>
          {" · "}
          Powered by{" "}
          <span className="text-purple-400">Farcaster</span>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="relative group">
      {/* Card glow on hover */}
      <div className="absolute inset-0 bg-linear-to-r from-amber-500/20 to-orange-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
      {/* Card */}
      <div className="relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-amber-500/30 transition-all">
        <div className="text-4xl mb-3">{icon}</div>
        <h3 className="text-lg font-bold text-white font-body mb-1">{title}</h3>
        <p className="text-sm text-white/60 font-display">{description}</p>
      </div>
    </div>
  );
}
