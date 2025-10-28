"use client";

import { useMiniUser } from "@/hooks/useMiniUser";
import { useCallback, useState } from "react";
import Image from "next/image";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import useSWR from "swr";
import { joinWaitlistAction } from "@/actions/waitlist";
import { useSearchParams, useRouter } from "next/navigation";
import { notify } from "@/components/ui/Toaster";
import { CardStack } from "@/components/CardStack";
import { fetcher } from "@/lib/fetcher";
import { motion } from "framer-motion";
import { useComposeCast } from "@coinbase/onchainkit/minikit";
import { env } from "@/lib/env";
import { SplashScreen } from "@/components/ui/SplashScreen";

interface WaitlistStatus {
  onList: boolean;
  rank: number | null;
  invites: number;
}

export default function WaitlistPage() {
  const user = useMiniUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const { composeCastAsync } = useComposeCast();

  const { data, error, isLoading } = useSWR<WaitlistStatus>(
    user.fid ? `/api/waitlist/status?fid=${user.fid}` : null,
    fetcher
  );

  const onList = data?.onList ?? false;
  const rank = data?.rank ?? null;
  const friendsCount = data?.invites ?? 0;

  const join = async () => {
    if (!user.fid || isJoining) return;
    setIsJoining(true);
    notify.info("Joining waitlist...");

    const formData = new FormData();
    formData.append("fid", String(user.fid));

    const ref = searchParams.get("ref");
    if (ref) formData.append("referrerFid", ref);

    try {
      const result = await joinWaitlistAction(formData);
      if (result.ok) {
        notify.success(
          result.already
            ? "You were already on the list!"
            : "Successfully joined the waitlist!"
        );
        router.refresh();
      } else notify.error(result.error || "Failed to join waitlist.");
    } catch (err) {
      notify.error("Unexpected error occurred.");
    } finally {
      setIsJoining(false);
    }
  };

  const share = useCallback(async () => {
    const message = `I'm on the Waffles waitlist! Join me at ${window.location.origin}/waitlist?ref=${user.fid}`;

    notify.info("Opening Farcaster composer...");
    try {
      const result = await composeCastAsync({
        text: message,
        embeds: [env.rootUrl ? { url: env.rootUrl } : undefined].filter(
          Boolean
        ) as unknown as [string],
      });

      if (result?.cast) {
        console.log("Cast created successfully:", result.cast.hash);
        notify.success("Shared successfully!");
      } else {
        console.log("User cancelled the cast");
        notify.info("Share cancelled.");
      }
    } catch (error) {
      console.error("Error sharing to Farcaster:", error);
      notify.error("Failed to share waitlist.");
    }
  }, [user.fid, composeCastAsync]);

  if (isLoading || !user.fid) return <SplashScreen />;

  if (error)
    return (
      <main className="flex items-center justify-center min-h-screen text-red-400 bg-gradient-to-b from-[#1E1E1E] to-black">
        Failed to load waitlist status.
      </main>
    );

  return (
    <main className="relative min-h-screen w-full max-w-[420px] mx-auto bg-gradient-to-b from-[#1E1E1E] to-black overflow-hidden text-white pt-[env(safe-area-inset-top)] px-4">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mt-6 flex justify-center"
      >
        <div
          style={{
            width: "224.06px",
            height: "42.58px",
          }}
          className="flex flex-row items-center justify-center gap-[12px]"
        >
          <Image
            src="/logo.png"
            alt="WAFFLES logo"
            width={55}
            height={43}
            priority
            className="object-contain"
          />
          <span className="font-extrabold uppercase text-[32px] leading-[28px] tracking-wide font-body">
            WAFFLES
          </span>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="flex justify-center mt-[7vh]"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src="/images/illustrations/waitlist-scroll.svg"
            width={170}
            height={189}
            alt="scroll"
            className="w-[38vw] max-w-[170px]"
          />
        </motion.div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.2 }}
        className="mt-[7vh] flex flex-col items-center text-center"
      >
        {onList ? (
          <>
            <h1 className="font-body text-white text-[clamp(32px,8vw,44px)] leading-[92%]">
              YOU&apos;RE ON <br /> THE LIST
            </h1>

            <p className="text-[#99A0AE] font-display text-[clamp(14px,3.4vw,18px)] leading-[130%] mt-3">
              {rank
                ? `You're #${rank} on the waitlist.`
                : "You're on the waitlist!"}
              <br />
              You’ve invited {friendsCount} friend
              {friendsCount === 1 ? "" : "s"}. Share to move up faster.
            </p>

            <FancyBorderButton onClick={share} className="mt-6">
              SHARE
            </FancyBorderButton>
          </>
        ) : (
          <>
            <h1 className="font-body text-white text-[clamp(32px,8vw,44px)] leading-[92%]">
              JOIN THE WAITLIST
            </h1>

            <p className="text-[#99A0AE] font-display text-[clamp(14px,3.4vw,18px)] leading-[130%] mt-3">
              Join now to be first to play when Waffles launches
            </p>

            <FancyBorderButton
              onClick={join}
              disabled={isJoining}
              className="mt-6"
            >
              {isJoining ? "JOINING..." : "GET ME ON THE LIST"}
            </FancyBorderButton>
          </>
        )}
      </motion.div>
      <motion.div
        className="mt-8 mb-[env(safe-area-inset-bottom)] pb-6 flex items-center justify-center gap-2"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <CardStack
          images={[
            { src: "/images/avatars/a.png" },
            { src: "/images/avatars/b.png" },
            { src: "/images/avatars/c.png" },
            { src: "/images/avatars/d.png" },
          ]}
          size="clamp(30px, 9vw, 42px)"
          borderColor="#FFFFFF"
          rotations={[-8, 5, -5, 7]}
        />
        <p className="text-[#99A0AE] font-display text-[clamp(14px,3.4vw,18px)] leading-[130%] mt-3">
          You and {friendsCount} friends are on the list
        </p>
      </motion.div>
    </main>
  );
}

export const dynamic = "force-dynamic";
