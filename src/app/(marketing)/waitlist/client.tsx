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

  // Shuffle the splash images randomly
  const splashImages = [
    "/images/splash/crew-4.png",
    "/images/splash/crew-1.png",
    "/images/splash/crew-8.png",
    "/images/splash/crew-2.png",
    "/images/splash/crew-3.png",
    "/images/splash/crew-6.png",
    "/images/splash/crew-5.png",
    "/images/splash/crew-7.png",
    "/images/splash/crew-9.png",
    "/images/splash/crew-10.png",
  ];

  // Helper for good English messages
  const friendText = (n: number) =>
    n === 0
      ? "No friends invited yet. Share to climb the list!"
      : n === 1
      ? "You've invited 1 friend. Share to move up!"
      : `You've invited ${n} friends. Share to move up!`;

  const rankMsg = (n: number | null) => {
    if (n === 1) return "You're #1 on the waitlist.";
    if (n && n > 1) return `You're #${n} on the waitlist.`;
    return "You're on the waitlist!";
  };

  const headingClasses =
    "font-body font-normal not-italic text-[44px] leading-[92%] tracking-[-0.03em] text-center text-white";
  const descriptionClasses =
    "text-[#99A0AE] font-display font-medium text-[16px] leading-[130%] tracking-[-0.03em] text-center mb-2";
  const buttonClasses = "w-[361px] mx-auto";
  const errorClasses = "text-red-400 text-sm";

  // Render content based on state
  const renderContent = () => {
    if (isLoading) {
      return <h1 className={headingClasses}>LOADING...</h1>;
    }

    if (error) {
      return (
        <>
          <h1 className={headingClasses}>ERROR</h1>
          <p className={errorClasses}>{error}</p>
        </>
      );
    }

    if (onList) {
      return (
        <>
          <h1 className={headingClasses}>YOU&apos;RE ON THE LIST</h1>
          <p className={descriptionClasses}>
            {rankMsg(rank)}
            <br />
            {friendText(invites)}
          </p>
          <FancyBorderButton
            onClick={share}
            className={buttonClasses}
            disabled={pending}
          >
            SHARE
          </FancyBorderButton>
        </>
      );
    }

    return (
      <>
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
      </>
    );
  };

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
          {renderContent()}
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
          />
          <p className="font-medium font-display text-[#99A0AE] text-[16px] leading-[130%] tracking-[-0.03em] text-center">
            {invites === 0
              ? "You and others are on the list"
              : `You and ${invites} friend${
                  invites === 1 ? "" : "s"
                } are on the list`}
          </p>
        </motion.div>
      </section>
      <footer className="shrink-0">
        <div className="flex flex-row items-stretch  -space-x-16">
          {splashImages.map((src, index) => (
            <Image
              priority
              key={src}
              src={src}
              alt={`Splash character ${index + 1}`}
              width={68}
              height={88}
              className="h-20 w-auto object-contain"
            />
          ))}
        </div>
      </footer>
    </>
  );
}
