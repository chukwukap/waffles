"use client";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { CardStack } from "@/components/CardStack";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  use,
  useCallback,
  startTransition,
  useEffect,
  useActionState,
} from "react";
import { useRouter } from "next/navigation";
import { ShareButton } from "./_components/ShareButton";
import { joinWaitlistAction, type JoinWaitlistState } from "@/actions/waitlist";
import { WaitlistData } from "./page";
import { useAddFrame, useMiniKit } from "@coinbase/onchainkit/minikit";

export function WaitlistClient({
  waitlistDataPromise,
  referrerFid,
}: {
  waitlistDataPromise: Promise<WaitlistData>;
  referrerFid?: number | null;
}) {
  const { onList, rank, invites } = use(waitlistDataPromise);
  const addFrame = useAddFrame();
  const { context } = useMiniKit();
  const router = useRouter();

  const [state, action, pending] = useActionState<JoinWaitlistState, FormData>(
    joinWaitlistAction,
    { ok: false }
  );

  const handleAddFrame = useCallback(async () => {
    if (!context?.user?.fid) return;

    try {
      // The webhook will handle saving the notification token
      // We just need to trigger the add frame flow
      await addFrame();
    } catch (error) {
      console.error("Error adding frame:", error);
    }
  }, [addFrame, context?.user?.fid]);

  const handleSubmit = useCallback(
    (formData: FormData) => {
      if (!context?.user?.fid) return;

      startTransition(() => {
        action(formData);
      });
    },
    [action, context?.user?.fid]
  );

  // Handle successful join - refresh page and prompt to add mini app if needed
  useEffect(() => {
    if (state.ok && !state.already && !pending) {
      // Refresh the page to show updated waitlist status
      // router.refresh();

      // Prompt to add mini app if not already added
      if (context?.client.added === false) {
        handleAddFrame();
      }
    }
  }, [
    state.ok,
    state.already,
    pending,
    context?.client.added,
    handleAddFrame,
    router,
  ]);

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
                You&apos;ve invited {invites} friend
                {invites === 1 ? "" : "s"}. Share to move up faster.
              </p>

              <ShareButton className="mt-2" disabled={pending} />
            </>
          ) : (
            <>
              <h1 className="font-body text-white text-[clamp(32px,8vw,44px)] leading-[92%]">
                JOIN THE WAITLIST
              </h1>
              <p className="text-[#99A0AE] font-display text-[clamp(14px,3.4vw,18px)] leading-[130%] mt-3">
                Join now to be first to play when Waffles launches
              </p>
              {state.error && (
                <p className="text-red-400 text-sm mt-2">{state.error}</p>
              )}
              <form action={handleSubmit} className="mt-6">
                {context?.user?.fid && (
                  <input type="hidden" name="fid" value={context.user.fid} />
                )}
                {referrerFid && (
                  <input type="hidden" name="referrerFid" value={referrerFid} />
                )}
                <FancyBorderButton type="submit" disabled={pending}>
                  {pending ? "JOINING..." : "GET ME ON THE LIST"}
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
            You and {invites} friend
            {invites === 1 ? "" : "s"} are on the list
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
