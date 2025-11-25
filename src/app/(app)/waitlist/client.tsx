"use client";

import { useComposeCast } from "@coinbase/onchainkit/minikit";
import { notify } from "@/components/ui/Toaster";
import {
  useCallback,
  startTransition,
  useEffect,
  useActionState,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import confetti from "canvas-confetti";

import { joinWaitlistAction, type JoinWaitlistState } from "@/actions/waitlist";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { sdk } from "@farcaster/miniapp-sdk";
import { env } from "@/lib/env";

import { WaitlistFooter } from "./_components/Footer";
import { WaitlistMutuals } from "./_components/WaitlistMutuals";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";

import { useWaitlistData } from "@/hooks/useWaitlistData";
import { useMutuals } from "@/hooks/useMutuals";
import { WaffleLoader } from "@/components/ui/WaffleLoader";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as any,
      stiffness: 300,
      damping: 24,
    },
  },
};

// --- Main Component ---
export function WaitlistClient() {
  const { context, isMiniAppReady, setMiniAppReady } = useMiniKit();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { composeCastAsync } = useComposeCast();

  const fid = context?.user?.fid;
  const ref = searchParams.get("ref") || null;

  // 1. Data Fetching
  const { data: waitlistData, isLoading, error, refetch } = useWaitlistData(fid);
  const mutualsData = useMutuals(fid);

  // 2. Form Action
  const [state, action, pending] = useActionState<JoinWaitlistState, FormData>(
    joinWaitlistAction,
    { ok: false }
  );

  // 3. Side Effects & Handlers

  // Initialize MiniKit
  useEffect(() => {
    if (!isMiniAppReady) setMiniAppReady();
  }, [isMiniAppReady, setMiniAppReady]);

  // Handle Join Success
  useEffect(() => {
    if (state.ok && !pending) {
      refetch();
      // Trigger confetti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);
    }
  }, [state.ok, pending, refetch]);

  // Redirect ACTIVE users to game
  useEffect(() => {
    if (waitlistData?.status === "ACTIVE") {
      router.replace("/game");
    }
  }, [waitlistData?.status, router]);

  const handleSubmit = useCallback(
    async (formData: FormData) => {
      console.log("[WaitlistClient] handleSubmit called with fid:", fid);

      if (!fid) return;

      // Trigger Add MiniApp
      try {
        console.log("[WaitlistClient] Attempting to call sdk.actions.addMiniApp()");
        console.log("[WaitlistClient] sdk object:", sdk);
        console.log("[WaitlistClient] sdk.actions:", sdk?.actions);

        const result = await sdk.actions.addMiniApp();
        console.log("[WaitlistClient] addMiniApp result:", result);
      } catch (error) {
        console.error("[WaitlistClient] Failed to add miniapp:", error);
        // Continue with join even if addMiniApp fails
      }

      startTransition(() => {
        action(formData);
      });
    },
    [action, fid]
  );

  const handleShare = useCallback(async () => {
    const rank = waitlistData?.rank;
    const message = `i just joined the /waffles waitlist now!! join me on the biggest game rn🤪🤪🤪🤪`;
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
  }, [composeCastAsync, fid, waitlistData?.rank]);

  // Helper for rank message
  const rankMsg = (n: number | null) => {
    if (n === 1) return "You're #1 on the waitlist.";
    if (n && n > 1) return `You're #${n} on the waitlist.`;
    return "You're on the waitlist!";
  };

  // 4. Render Logic

  if (isLoading) {
    return (
      <section className="flex-1 flex items-center justify-center">
        <WaffleLoader text="CHECKING LIST..." />
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex-1 flex flex-col items-center justify-center gap-4">
        <h1 className="font-body font-normal text-[44px] text-center text-white">
          ERROR
        </h1>
        <p className="text-red-400 text-sm">{error}</p>
      </section>
    );
  }

  if (waitlistData?.onList) {
    return (
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 overflow-y-auto px-4 space-y-4 flex flex-col items-center"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="mt-14">
          <div className="w-[224px] h-[42px] relative">
            <Image
              src="/logo-onboarding.png"
              alt="WAFFLES logo"
              width={224}
              height={42}
              priority
              className="object-contain"
            />
          </div>
        </motion.div>

        {/* Scroll Illustration */}
        <motion.div
          variants={itemVariants}
          className="flex-1 flex items-center justify-center min-h-[200px]"
        >
          <motion.div
            animate={{ y: [0, -12, 0], rotate: [0, -2, 2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            whileHover={{ scale: 1.05, rotate: 0 }}
          >
            <Image
              src="/images/illustrations/waitlist-scroll.svg"
              width={170}
              height={189}
              priority
              alt="scroll"
              className="drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
            />
          </motion.div>
        </motion.div>

        {/* Content: Rank & Description */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center text-center w-full pb-4"
        >
          <h1 className="font-body font-normal not-italic text-[44px] leading-[92%] tracking-[-0.03em] text-center text-white mb-1">YOU'RE ON <br />THE LIST!</h1>

          {/* Dynamic Rank Message based on Figma design */}
          <p className={"text-[#99A0AE] font-display font-medium text-[16px] leading-[130%] tracking-[-0.03em] text-center mb-2 text-pretty max-w-[320px] mx-auto"}>
            {rankMsg(waitlistData.rank)} Move up faster <br />by completing tasks and inviting
            friends!
          </p>

          {/* Primary Action: COMPLETE TASKS */}
          <div className="mt-6 w-full flex flex-col items-center gap-4">
            <FancyBorderButton
              onClick={() => router.push("/waitlist/tasks")}
              className={"mx-auto text-[#191919] text-[26px]"}
              disabled={pending}
            >
              COMPLETE TASKS
            </FancyBorderButton>

            {/* Secondary Action: SHARE WAITLIST (Text Link Style) */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className="font-body text-[#00CFF2] text-[24px] leading-none tracking-normal hover:opacity-80 transition-opacity uppercase"
            >
              SHARE WAITLIST
            </motion.button>
          </div>
        </motion.div>

        {/* Mutuals Footer */}
        <motion.div variants={itemVariants}>
          <WaitlistMutuals mutualsData={mutualsData} />
        </motion.div>
      </motion.section>
    );
  }

  return (
    <>
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 overflow-y-auto px-3 space-y-3"
      >
        <motion.div variants={itemVariants}>
          <div className="w-[224px] h-[42px] relative mt-14 mx-auto">
            <Image
              src="/logo-onboarding.png"
              alt="WAFFLES logo"
              width={224}
              height={42}
              priority
              className="object-contain"
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <motion.div
            animate={{ y: [0, -12, 0], rotate: [0, 2, -2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            whileHover={{ scale: 1.05, rotate: 0 }}
          >
            <Image
              src="/images/illustrations/waitlist-scroll.svg"
              width={170}
              height={189}
              priority
              alt="scroll"
              className="mx-auto my-8 drop-shadow-2xl"
            />
          </motion.div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mt-[2vh] flex flex-col items-center text-center w-full gap-2"
        >
          {/* Join Form UI */}
          <h1 className={"font-body font-normal not-italic text-[44px] leading-[92%] tracking-[-0.03em] text-center text-white mb-1"}>JOIN THE <br />WAITLIST</h1>

          <p className={"text-[#99A0AE] font-display font-medium text-[16px] leading-[130%] tracking-[-0.03em] text-center mx-auto"}>
            Join now to be first to play when <br /> Waffles launches
          </p>
          {state.error && <p className={"text-red-400 text-sm"}>{state.error}</p>}

          <FancyBorderButton
            onClick={() => {
              console.log("[WaitlistClient] Button clicked, fid:", fid);
              const formData = new FormData();
              if (fid) formData.append("fid", fid.toString());
              if (ref) formData.append("ref", ref.toString());
              handleSubmit(formData);
            }}
            disabled={pending}
            className={"mx-auto text-[#191919] text-[26px] px-5 w-full max-w-full"}
          >
            {pending ? "JOINING..." : "GET ME ON THE LIST"}
          </FancyBorderButton>

        </motion.div>

        <motion.div variants={itemVariants}>
          <WaitlistMutuals mutualsData={mutualsData} />
        </motion.div>
      </motion.section>
      <WaitlistFooter />
    </>
  );
}