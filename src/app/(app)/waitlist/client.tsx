"use client";

import { useAddFrame, useComposeCast } from "@coinbase/onchainkit/minikit";
import { notify } from "@/components/ui/Toaster";
import {
  useCallback,
  startTransition,
  useEffect,
  useActionState,
  useState,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import Image from "next/image";
import confetti from "canvas-confetti";

import { joinWaitlistAction, type JoinWaitlistState } from "@/actions/waitlist";
import { saveNotificationTokenAction } from "@/actions/notifications";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { env } from "@/lib/env";

import { WaitlistFooter } from "./_components/Footer";
import { WaitlistMutuals } from "./_components/WaitlistMutuals";
import { WaffleButton } from "@/components/buttons/WaffleButton";

import { useUser } from "@/hooks/useUser";
import { useMutuals } from "@/hooks/useMutuals";
import { WaffleLoader } from "@/components/ui/WaffleLoader";

// ============================================
// FLOATING PARTICLES - Background magic ✨
// ============================================
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-amber-400/30 rounded-full"
          style={{
            left: `${10 + i * 7}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, i % 2 === 0 ? 10 : -10, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + (i % 3),
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}
      {/* Larger floating orbs */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute w-32 h-32 rounded-full blur-3xl"
          style={{
            background:
              i % 2 === 0
                ? "radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
            left: `${i * 30}%`,
            top: `${30 + (i % 2) * 40}%`,
          }}
          animate={{
            x: [0, 20, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// ANIMATED LOGO - With glow pulse
// ============================================
function AnimatedLogo({ size = "normal" }: { size?: "normal" | "large" }) {
  const width = size === "large" ? 200 : 122;
  const height = size === "large" ? 38 : 23;

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      {/* Glow behind logo */}
      <motion.div
        className="absolute inset-0 blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)",
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <Image
        src="/logo-onboarding.png"
        alt="WAFFLES logo"
        width={width}
        height={height}
        priority
        className="object-contain relative z-10"
      />
    </motion.div>
  );
}

// ============================================
// MAGICAL SCROLL - The hero illustration
// ============================================
function MagicalScroll() {
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 40, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 150,
        damping: 20,
        delay: 0.2,
      }}
    >
      {/* Magical glow ring */}
      <motion.div
        className="absolute -inset-8 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 60%)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Sparkles around scroll */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-amber-300 rounded-full"
          style={{
            left: `${50 + Math.cos((i * 60 * Math.PI) / 180) * 60}%`,
            top: `${50 + Math.sin((i * 60 * Math.PI) / 180) * 60}%`,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* The scroll itself */}
      <motion.div
        animate={{
          y: [0, -12, 0],
          rotate: [0, -3, 3, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Image
          src="/images/illustrations/waitlist-scroll.svg"
          width={170}
          height={189}
          priority
          alt="scroll"
          className="drop-shadow-[0_15px_40px_rgba(251,191,36,0.3)] max-h-full w-auto object-contain"
        />
      </motion.div>
    </motion.div>
  );
}

// ============================================
// INLINE RANK - Compact, doesn't add height
// ============================================
function InlineRank({ rank }: { rank: number | null }) {
  if (!rank) return null;

  return (
    <motion.span
      className="inline-flex items-center ml-2"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.4 }}
    >
      <span className="text-amber-400 font-body text-[32px] leading-none">
        #{rank}
      </span>
    </motion.span>
  );
}

// ============================================
// SHIMMERING TEXT - For headlines
// ============================================
function ShimmerText({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.span
      className={`relative inline-block ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.3 }}
    >
      {/* Shimmer overlay */}
      <motion.span
        className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 2,
        }}
        style={{ WebkitBackgroundClip: "text" }}
      />
      {children}
    </motion.span>
  );
}

// ============================================
// ANIMATED BUTTON GROUP
// ============================================
function ActionButtons({
  onShare,
  pending,
}: {
  onShare: () => void;
  pending: boolean;
}) {
  const questRouter = useRouter();

  return (
    <motion.div
      className="w-full flex flex-col items-center gap-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, type: "spring", stiffness: 200, damping: 20 }}
    >
      <WaffleButton
        onClick={() => questRouter.push(`/waitlist/quests`)}
        className="mx-auto text-[#191919] text-[22px]"
        disabled={pending}
      >
        <motion.span
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          COMPLETE QUESTS
        </motion.span>
      </WaffleButton>

      {/* Secondary Actions */}
      <div className="flex gap-2 w-full max-w-sm justify-center">
        {[
          { label: "SHARE", onClick: onShare },
          { label: "LEADERBOARD", href: "/waitlist/leaderboard" },
        ].map((btn, i) => (
          <motion.div
            key={btn.label}
            className="flex-1"
            initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + i * 0.1, type: "spring" }}
          >
            {btn.href ? (
              <Link
                href={btn.href}
                className="flex items-center justify-center w-full h-[42px] rounded-xl border-2 border-white/30 bg-white/5 backdrop-blur-sm font-body font-normal text-white/90 text-[13px] leading-none uppercase transition-all active:scale-95 active:bg-white/10"
              >
                {btn.label}
              </Link>
            ) : (
              <button
                onClick={btn.onClick}
                className="w-full h-[42px] rounded-xl border-2 border-white/30 bg-white/5 backdrop-blur-sm font-body font-normal text-white/90 text-[13px] leading-none uppercase transition-all active:scale-95 active:bg-white/10"
              >
                {btn.label}
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================
// JOIN CTA - The main call to action
// ============================================
function JoinCTA({
  onJoin,
  pending,
  error,
}: {
  onJoin: () => void;
  pending: boolean;
  error?: string;
}) {
  const buttonControls = useAnimation();

  // Subtle attention-grabbing animation
  useEffect(() => {
    const interval = setInterval(() => {
      if (!pending) {
        buttonControls.start({
          scale: [1, 1.02, 1],
          transition: { duration: 0.6 },
        });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [buttonControls, pending]);

  return (
    <motion.div
      className="w-full flex flex-col items-center gap-3"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 20 }}
    >
      <AnimatePresence>
        {error && (
          <motion.p
            className="text-red-400 text-sm"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div animate={buttonControls} className="w-full">
        <WaffleButton
          onClick={onJoin}
          disabled={pending}
          className="mx-auto text-[#191919] text-[22px] w-full"
        >
          <AnimatePresence mode="wait">
            {pending ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-[#191919]/30 border-t-[#191919] rounded-full"
                />
                JOINING...
              </motion.span>
            ) : (
              <motion.span
                key="cta"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                GET ME ON THE LIST
              </motion.span>
            )}
          </AnimatePresence>
        </WaffleButton>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export function WaitlistClient() {
  const { context } = useMiniKit();
  const addFrame = useAddFrame();
  const searchParams = useSearchParams();
  const { composeCastAsync } = useComposeCast();

  const fid = context?.user?.fid;
  const ref = searchParams.get("ref") || null;

  // Data Fetching
  const { user, isLoading, error, refetch } = useUser();
  const mutualsData = useMutuals();

  // Track if user just joined (for celebration)
  const [justJoined, setJustJoined] = useState(false);

  // Form Action
  const [state, action, pending] = useActionState<JoinWaitlistState, FormData>(
    joinWaitlistAction,
    { ok: false }
  );

  // Handle Join Success - Celebration! 🎉
  useEffect(() => {
    if (state.ok && !pending) {
      setJustJoined(true);
      refetch();

      // Epic confetti celebration
      const duration = 4 * 1000;
      const animationEnd = Date.now() + duration;
      const colors = ["#FFC931", "#FFD972", "#B45CFF", "#2E7DFF", "#18DCA5"];

      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 60 * (timeLeft / duration);

        // Left side burst
        confetti({
          particleCount: Math.floor(particleCount / 2),
          startVelocity: 35,
          spread: 80,
          origin: { x: randomInRange(0.1, 0.3), y: randomInRange(0.2, 0.4) },
          colors,
          ticks: 80,
          gravity: 0.8,
          scalar: 1.2,
        });

        // Right side burst
        confetti({
          particleCount: Math.floor(particleCount / 2),
          startVelocity: 35,
          spread: 80,
          origin: { x: randomInRange(0.7, 0.9), y: randomInRange(0.2, 0.4) },
          colors,
          ticks: 80,
          gravity: 0.8,
          scalar: 1.2,
        });
      }, 200);

      // Reset justJoined after animation
      setTimeout(() => setJustJoined(false), 4000);
    }
  }, [state.ok, pending, refetch]);

  const handleSubmit = useCallback(
    async (formData: FormData) => {
      if (!fid) return;

      try {
        const result = await addFrame();
        if (result && context?.client.clientFid) {
          await saveNotificationTokenAction(
            fid,
            context.client.clientFid,
            result
          );
        }
      } catch (err) {
        console.error("Failed to add miniapp:", err);
      }

      startTransition(() => {
        action(formData);
      });
    },
    [action, addFrame, fid, context?.client.clientFid]
  );

  const handleShare = useCallback(async () => {
    const rank = user?.waitlistRank;
    const message = `Just got in to waffles
if you need me i'd be knead deep in trivia

think you can beat me? you're on😏`;
    try {
      const result = await composeCastAsync({
        text: message,
        embeds: [`${env.rootUrl}/waitlist?ref=${fid}&rank=${rank}`],
      });
      if (result?.cast) notify.success("Shared successfully!");
      else notify.info("Share cancelled.");
    } catch (err) {
      console.error(err);
      notify.error("Failed to share waitlist.");
    }
  }, [composeCastAsync, fid, user?.waitlistRank]);

  const handleJoin = useCallback(() => {
    const formData = new FormData();
    if (fid) formData.append("fid", fid.toString());
    if (ref) formData.append("ref", ref.toString());
    handleSubmit(formData);
  }, [fid, ref, handleSubmit]);

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <section className="flex-1 flex items-center justify-center">
        <WaffleLoader text="" />
      </section>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error) {
    return (
      <motion.section
        className="flex-1 flex flex-col items-center justify-center gap-4 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5, repeat: 3 }}
        >
          <h1 className="font-body font-normal text-[44px] text-center text-white">
            OOPS!
          </h1>
        </motion.div>
        <p className="text-red-400 text-sm text-center">{error}</p>
      </motion.section>
    );
  }

  // ============================================
  // ON THE LIST VIEW
  // ============================================
  if (user?.joinedWaitlistAt || user?.hasGameAccess) {
    return (
      <>
        <section className="relative flex-1 min-h-0 overflow-hidden px-4 flex flex-col items-center">
          {/* Background particles */}
          <FloatingParticles />

          {/* Logo */}
          <motion.div
            className="shrink-0 pt-6 pb-2 z-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <AnimatedLogo />
          </motion.div>

          {/* Scroll Illustration */}
          <div className="flex-1 min-h-0 flex items-center justify-center py-2 z-10">
            <MagicalScroll />
          </div>

          {/* Content */}
          <div className="shrink-0 flex flex-col items-center text-center w-full pb-2 z-10">
            {/* Celebration text */}
            <AnimatePresence>
              {justJoined && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: -20 }}
                  className="mb-2"
                >
                  <span className="text-amber-300 font-body text-lg">
                    🎉 Welcome aboard! 🎉
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <ShimmerText className="font-body font-normal not-italic text-[38px] leading-[92%] tracking-[-0.03em] text-center text-white mb-1">
              YOU&apos;RE ON
              <br />
              THE LIST!
            </ShimmerText>

            {/* Subtitle with inline rank */}
            <motion.p
              className="text-[#99A0AE] font-display font-medium text-[14px] leading-[140%] tracking-[-0.03em] text-center text-pretty mx-auto mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              You&apos;re <InlineRank rank={user.waitlistRank} /> on the waitlist.
              <br />
              Move up by completing quests!
            </motion.p>

            {/* Action Buttons */}
            <ActionButtons onShare={handleShare} pending={pending} />
          </div>

          {/* Mutuals */}
          <motion.div
            className="shrink-0 py-2 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <WaitlistMutuals mutualsData={mutualsData} />
          </motion.div>
        </section>

        <WaitlistFooter />
      </>
    );
  }

  // ============================================
  // JOIN VIEW (Not on list yet)
  // ============================================
  return (
    <>
      <section className="relative flex-1 min-h-0 overflow-hidden px-4 flex flex-col items-center">
        {/* Background particles */}
        <FloatingParticles />

        {/* Logo */}
        <motion.div
          className="shrink-0 pt-8 pb-2 z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AnimatedLogo size="large" />
        </motion.div>

        {/* Scroll Illustration */}
        <div className="flex-1 min-h-0 flex items-center justify-center py-2 z-10">
          <MagicalScroll />
        </div>

        {/* Join Form UI */}
        <div className="shrink-0 flex flex-col items-center text-center w-full gap-2 pb-2 z-10">
          <ShimmerText className="font-body font-normal not-italic text-[38px] leading-[92%] tracking-[-0.03em] text-center text-white mb-1">
            JOIN THE
            <br />
            WAITLIST
          </ShimmerText>

          <motion.p
            className="text-[#99A0AE] font-display font-medium text-[14px] leading-[130%] tracking-[-0.03em] text-center mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Join now to be first to play when
            <br />
            Waffles launches
          </motion.p>

          <JoinCTA onJoin={handleJoin} pending={pending} error={state.error} />
        </div>

        {/* Mutuals */}
        <motion.div
          className="shrink-0 py-2 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <WaitlistMutuals mutualsData={mutualsData} />
        </motion.div>
      </section>

      <WaitlistFooter />
    </>
  );
}
