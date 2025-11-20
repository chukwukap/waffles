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

import { joinWaitlistAction, type JoinWaitlistState } from "@/actions/waitlist";
import { useAddFrame, useMiniKit } from "@coinbase/onchainkit/minikit";
import { env } from "@/lib/env";

import { WaitlistFooter } from "./_components/Footer";
import { WaitlistMutuals } from "./_components/WaitlistMutuals";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";

import { useWaitlistData } from "@/hooks/useWaitlistData";
import { useMutuals } from "@/hooks/useMutuals";

// --- Main Component ---
export function WaitlistClient() {
  const { context, isMiniAppReady, setMiniAppReady } = useMiniKit();
  const searchParams = useSearchParams();
  const router = useRouter();
  const addFrame = useAddFrame();
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
    }
  }, [state.ok, pending]);

  // Redirect ACTIVE users to game
  useEffect(() => {
    if (waitlistData?.status === "ACTIVE") {
      router.replace("/game");
    }
  }, [waitlistData?.status, router]);

  const handleSubmit = useCallback(
    (formData: FormData) => {
      if (!fid) return;
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
    } catch {
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
        <h1 className="font-body font-normal text-[44px] text-center text-white">
          LOADING...
        </h1>
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
      <section className="flex-1 overflow-y-auto px-4 space-y-4 flex flex-col items-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-14"
        >
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
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="flex-1 flex items-center justify-center min-h-[200px]"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
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
            <button
              onClick={handleShare}
              className="font-body text-[#00CFF2] text-[24px] leading-none tracking-normal hover:opacity-80 transition-opacity uppercase"
            >
              SHARE WAITLIST
            </button>
          </div>
        </motion.div>

        {/* Mutuals Footer */}
        <WaitlistMutuals mutualsData={mutualsData} />
      </section>
    );
  }

  return (
    <>
      <section className="flex-1 overflow-y-auto px-3 space-y-3">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
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
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/images/illustrations/waitlist-scroll.svg"
              width={170}
              height={189}
              priority
              alt="scroll"
              className="mx-auto my-8"
            />
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
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

        <WaitlistMutuals mutualsData={mutualsData} />
      </section>
      <WaitlistFooter />
    </>
  );
}