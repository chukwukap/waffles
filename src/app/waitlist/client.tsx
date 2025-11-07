"use client";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { CardStack } from "@/components/CardStack";
import { motion } from "framer-motion";
import Image from "next/image";
import { use } from "react";
import { ShareButton } from "./_components/ShareButton";
import { joinWaitlistAction } from "@/actions/waitlist";
import { useRouter } from "next/navigation";
import { WaitlistData } from "./page";
import { useAddFrame, useMiniKit } from "@coinbase/onchainkit/minikit";
import { saveNotificationTokenAction } from "@/actions/notification";
import { useEffect, useCallback, useState } from "react";

export function WaitlistClient({
  waitlistDataPromise,
  referrerFid,
}: {
  waitlistDataPromise: Promise<WaitlistData>;
  referrerFid: number | null;
}) {
  const { waitlist, userFid } = use(waitlistDataPromise);

  const fid = userFid;

  const router = useRouter();
  const addFrame = useAddFrame();
  const { context } = useMiniKit();
  const [hasPromptedAddFrame, setHasPromptedAddFrame] = useState(false);

  const handleAddFrame = useCallback(async () => {
    if (!fid) return;

    try {
      const result = await addFrame();

      if (result) {
        // Save notification token to backend
        const formData = new FormData();
        formData.set("fid", String(fid));
        formData.set("token", result.token);
        formData.set("url", result.url);

        await saveNotificationTokenAction(formData);
        setHasPromptedAddFrame(true);
      }
    } catch (error) {
      console.error("Error adding frame:", error);
    }
  }, [addFrame, fid]);

  // Prompt user to add mini app after they join the waitlist
  useEffect(() => {
    // Only prompt if:
    // 1. User is on the waitlist
    // 2. We haven't prompted yet
    // 3. Mini app context is available and shows it's not already added
    // 4. User FID is available
    if (
      waitlist.onList &&
      !hasPromptedAddFrame &&
      context?.client.added === false &&
      fid
    ) {
      // Small delay to let the UI settle after joining
      const timer = setTimeout(() => {
        handleAddFrame();
      }, 1000);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitlist.onList, hasPromptedAddFrame, context?.client.added, fid]);

  async function join() {
    if (!fid) return;
    try {
      const formData = new FormData();
      formData.set("fid", String(fid));
      if (referrerFid) {
        formData.set("referrerFid", String(referrerFid));
      }
      await joinWaitlistAction(formData);
      router.refresh();
    } catch (error) {
      console.error("Error joining waitlist:", error);
    }
  }

  const splashImages = [
    "/images/splash/crew-1.png",
    "/images/splash/crew-2.png",
    "/images/splash/crew-3.png",
    "/images/splash/crew-4.png",
    "/images/splash/crew-5.png",
    "/images/splash/crew-6.png",
  ];

  return (
    <div className="relative min-h-screen w-full  overflow-hidden">
      <main className="relative w-full max-w-[420px] mx-auto text-white pt-[env(safe-area-inset-top)] px-4">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-6 flex justify-center"
        >
          <div className="flex flex-row items-center justify-center mt-10">
            <Image
              src="/logo-onboarding.png"
              alt="WAFFLES logo"
              width={200}
              height={150}
              priority
              className="object-contain"
            />
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
          className="mt-[2vh] flex flex-col items-center text-center"
        >
          {waitlist.onList ? (
            <>
              <h1 className="font-body text-white text-[clamp(32px,8vw,44px)] leading-[92%]">
                YOU&apos;RE ON <br /> THE LIST
              </h1>
              <p className="text-[#99A0AE] font-display text-[clamp(14px,3.4vw,18px)] leading-[130%] mt-3">
                {waitlist.rank
                  ? `You're #${waitlist.rank} on the waitlist.`
                  : "You're on the waitlist!"}
                <br />
                You&apos;ve invited {waitlist.invites} friend
                {waitlist.invites === 1 ? "" : "s"}. Share to move up faster.
              </p>

              <ShareButton className="mt-2" />
            </>
          ) : (
            <>
              <h1 className="font-body text-white text-[clamp(32px,8vw,44px)] leading-[92%]">
                JOIN THE WAITLIST
              </h1>
              <p className="text-[#99A0AE] font-display text-[clamp(14px,3.4vw,18px)] leading-[130%] mt-3">
                Join now to be first to play when Waffles launches
              </p>
              <form action={join} className="mt-6">
                <FancyBorderButton type="submit">
                  GET ME ON THE LIST
                </FancyBorderButton>
              </form>
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
            You and {waitlist.invites} friend
            {waitlist.invites === 1 ? "" : "s"} are on the list
          </p>
        </motion.div>
      </main>

      <div className="absolute bottom-0 w-full flex justify-center items-end pointer-events-none">
        <div className="flex flex-row items-end -space-x-4">
          {splashImages.map((src, index) => (
            <Image
              key={src}
              src={src}
              alt={`Splash character ${index + 1}`}
              width={68}
              height={88}
              className="h-20 w-auto object-contain"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
