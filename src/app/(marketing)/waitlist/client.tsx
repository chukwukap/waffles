"use client";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { CardStack } from "@/components/CardStack";
import { useComposeCast } from "@coinbase/onchainkit/minikit";
import { notify } from "@/components/ui/Toaster";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  useCallback,
  startTransition,
  useEffect,
  useActionState,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { joinWaitlistAction, type JoinWaitlistState } from "@/actions/waitlist";
import { useAddFrame, useMiniKit } from "@coinbase/onchainkit/minikit";
import { env } from "@/lib/env";
import { getMutualsAction, type MutualsData } from "@/actions/mutuals";
import { WaitlistTasks } from "./_components/WaitlistTasks"; // Import the new component
import { ArrowLeftIcon } from "@/components/icons";
import { WaitlistFooter } from "./_components/Footer";

export interface WaitlistData {
  onList: boolean;
  rank: number | null;
  invites: number;
}

export function WaitlistClient() {
  const { context } = useMiniKit();
  const searchParams = useSearchParams();
  const fid = context?.user?.fid;
  const ref = searchParams.get("ref") || null;
  const addFrame = useAddFrame();
  const router = useRouter();
  const [state, action, pending] = useActionState<JoinWaitlistState, FormData>(
    joinWaitlistAction,
    { ok: false }
  );
  const [waitlistData, setWaitlistData] = useState<WaitlistData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutualsData, setMutualsData] = useState<MutualsData | null>(null);

  // New State for toggling views
  const [showTasks, setShowTasks] = useState(false);

  // Fetch waitlist data helper
  const fetchWaitlistData = useCallback(async () => {
    if (!fid) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/waitlist?fid=${fid}`);

      if (!response.ok) {
        throw new Error("Failed to fetch waitlist data");
      }

      const data: WaitlistData = await response.json();
      setWaitlistData(data);
    } catch (err) {
      console.error("Error fetching waitlist data:", err);
      setError("Failed to load waitlist data");
      setWaitlistData({
        onList: false,
        rank: null,
        invites: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [fid]);

  // Fetch waitlist data on mount
  useEffect(() => {
    fetchWaitlistData();
  }, [fetchWaitlistData]);

  // Fetch mutuals data
  useEffect(() => {
    if (!fid) return;

    const fetchMutuals = async () => {
      try {
        const data = await getMutualsAction(fid, null, "waitlist");
        setMutualsData(data);
      } catch (err) {
        console.error("Error fetching mutuals:", err);
      }
    };

    fetchMutuals();
  }, [fid]);

  // Refresh waitlist data after successful join
  useEffect(() => {
    if (state.ok && !state.already && !pending && fid) {
      fetchWaitlistData();
    }
  }, [state.ok, state.already, pending, fid, fetchWaitlistData]);

  const { onList, rank, invites } = waitlistData || {
    onList: false,
    rank: null,
    invites: 0,
  };

  const handleAddFrame = useCallback(async () => {
    if (!context?.user?.fid) return;
    try {
      await addFrame();
    } catch (error) {
      console.error("Error adding frame:", error);
    }
  }, [addFrame, context?.user?.fid]);

  const { composeCastAsync } = useComposeCast();
  const share = useCallback(async () => {
    const message = `I'm on the Waffles waitlist! Join me!`;
    try {
      const result = await composeCastAsync({
        text: message,
        embeds: [
          `${env.rootUrl}/waitlist?ref=${context?.user?.fid}&rank=${rank}`,
        ],
      });
      if (result?.cast) notify.success("Shared successfully!");
      else notify.info("Share cancelled.");
    } catch {
      notify.error("Failed to share waitlist.");
    }
  }, [composeCastAsync, context?.user?.fid, rank]);

  const handleSubmit = useCallback(
    (formData: FormData) => {
      if (!context?.user?.fid) return;
      startTransition(() => {
        action(formData);
      });
    },
    [action, context?.user?.fid]
  );

  useEffect(() => {
    if (state.ok && !state.already && !pending) {
      if (context?.client.added === false) handleAddFrame();
    }
  }, [
    state.ok,
    state.already,
    pending,
    context?.client.added,
    handleAddFrame,
    router,
  ]);


  const rankMsg = (n: number | null) => {
    if (n === 1) return "You're #1 on the waitlist.";
    if (n && n > 1) return `You're #${n} on the waitlist.`;
    return "You're on the waitlist!";
  };

  const headingClasses =
    "font-body font-normal not-italic text-[44px] leading-[92%] tracking-[-0.03em] text-center text-white";
  const descriptionClasses =
    "text-[#99A0AE] font-display font-medium text-[16px] leading-[130%] tracking-[-0.03em] text-center mb-2 text-pretty max-w-[320px] mx-auto";
  const buttonClasses = "w-[361px] mx-auto text-[#191919] text-[26px]";
  const errorClasses = "text-red-400 text-sm";

  // ───────────────────────── RENDER LOGIC ─────────────────────────

  // 1. Loading
  if (isLoading) {
    return (
      <section className="flex-1 flex items-center justify-center">
        <h1 className={headingClasses}>LOADING...</h1>
      </section>
    );
  }

  // 2. Error
  if (error) {
    return (
      <section className="flex-1 flex flex-col items-center justify-center gap-4">
        <h1 className={headingClasses}>ERROR</h1>
        <p className={errorClasses}>{error}</p>
      </section>
    );
  }

  // 3. Task View (If toggled ON)
  if (showTasks) {
    return (
      <section className="flex-1 overflow-y-auto px-4 pb-8">
        {/* Task Header */}
        <div className="relative flex items-center justify-center h-[52px] mb-2">
          <button
            onClick={() => setShowTasks(false)}
            className="absolute left-0 p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-white" />
          </button>
          {/* Logo in header (optional based on design, usually centered) */}
          <div className="relative w-[124px] h-[24px]">
            <Image
              src="/logo-onboarding.png"
              alt="Waffles"
              fill
              className="object-contain"
            />
          </div>
        </div>

        <div className="mt-4">
          <WaitlistTasks invitesCount={invites} onInviteClick={share} />
        </div>
      </section>
    );
  }

  // 4. Main View: ON LIST
  if (onList) {
    return (
      <>
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
            {/* Dynamic Rank Message based on Figma design */}
            <p className={descriptionClasses}>
              {rankMsg(rank)} Move up faster by completing tasks and inviting friends!
            </p>

            {/* Primary Action: COMPLETE TASKS */}
            <div className="mt-6 w-full flex flex-col items-center gap-4">
              <FancyBorderButton
                onClick={() => setShowTasks(true)}
                className={buttonClasses}
                disabled={pending}
              >
                COMPLETE TASKS
              </FancyBorderButton>

              {/* Secondary Action: SHARE WAITLIST (Text Link Style) */}
              <button
                onClick={share}
                className="font-body text-[#00CFF2] text-[24px] leading-none tracking-normal hover:opacity-80 transition-opacity uppercase"
              >
                SHARE WAITLIST
              </button>
            </div>
          </motion.div>

          {/* Mutuals Footer */}
          <motion.div
            className="mb-[env(safe-area-inset-bottom)] pb-6 flex items-center justify-center gap-2 shrink-0"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <CardStack
              size="clamp(25px, 9vw, 42px)"
              borderColor="#FFFFFF"
              rotations={[-8, 5, -5, 7]}
              imageUrls={
                mutualsData?.mutuals
                  .map((m) => m.pfpUrl)
                  .filter((url): url is string => url !== null) ?? undefined
              }
            />
            <p className="font-medium font-display text-[#99A0AE] text-[16px] leading-[130%] tracking-[-0.03em] text-center">
              {mutualsData?.mutualCount === 0
                ? "You and others are on the list"
                : `You and ${mutualsData?.mutualCount ?? 0} friend${(mutualsData?.mutualCount ?? 0) === 1 ? "" : "s"
                } are on the list`}
            </p>
          </motion.div>

        </section>
      </>
    );
  }

  // 5. Default View: NOT ON LIST (Join Form)
  return (
    <>
      <section className="flex-1 overflow-y-auto px-4 space-y-4">
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
              className="mx-auto my-6"
            />
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mt-[2vh] flex flex-col items-center text-center"
        >
          {/* Join Form UI */}
          <h1 className={headingClasses}>JOIN THE WAITLIST</h1>
          <p className={descriptionClasses}>
            Join now to be first to play when <br /> Waffles launches
          </p>
          {state.error && <p className={errorClasses}>{state.error}</p>}
          <form action={handleSubmit} className="mt-6">
            {context?.user?.fid && (
              <input type="hidden" name="fid" value={context.user.fid} />
            )}
            {ref && <input type="hidden" name="ref" value={ref} />}
            <FancyBorderButton
              type="submit"
              disabled={pending}
              className={buttonClasses}
            >
              {pending ? "JOINING..." : "GET ME ON THE LIST"}
            </FancyBorderButton>
          </form>
        </motion.div>
        <motion.div
          className="mt-4 mb-[env(safe-area-inset-bottom)] pb-6 flex items-center justify-center gap-2"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <CardStack
            size="clamp(25px, 9vw, 42px)"
            borderColor="#FFFFFF"
            rotations={[-8, 5, -5, 7]}
            imageUrls={
              mutualsData?.mutuals
                .map((m) => m.pfpUrl)
                .filter((url): url is string => url !== null) ?? undefined
            }
          />
          <p className="font-medium font-display text-[#99A0AE] text-[16px] leading-[130%] tracking-[-0.03em] text-center">
            {mutualsData?.mutualCount === 0
              ? "You and others are on the list"
              : `You and ${mutualsData?.mutualCount ?? 0} friend${(mutualsData?.mutualCount ?? 0) === 1 ? "" : "s"
              } are on the list`}
          </p>
        </motion.div>
      </section>
      <WaitlistFooter />
    </>
  );
}