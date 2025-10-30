"use client";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { CardStack } from "@/components/CardStack";
import { motion } from "framer-motion";
import Image from "next/image";
import { Suspense } from "react";
import { ShareButton } from "./ShareButton";
import { joinWaitlistAction } from "@/actions/waitlist";
import { useRouter } from "next/navigation";

export function WaitlistClient({
  waitlist,
  fid,
  referrerFid,
}: {
  waitlist: {
    onList: boolean;
    rank: number | null;
    invites: number;
  };
  fid: number;
  referrerFid: number | null;
}) {
  const router = useRouter();
  async function join() {
    if (!fid) return;
    try {
      const formData = new FormData();
      formData.set("fid", String(fid));
      formData.set("referrerFid", referrerFid ? String(referrerFid) : "");
      await joinWaitlistAction(formData);
      router.push("/waitlist");
    } catch (error) {
      console.error("Error joining waitlist:", error);
    }
  }

  // Define the array of splash images based on the design
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
              <Suspense fallback={null}>
                {/* Client component for sharing */}
                <ShareButton userFid={fid} className="mt-6" />
              </Suspense>
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
            You and {waitlist.invites} friends are on the list
          </p>
        </motion.div>
      </main>

      {/* --- ADDED THIS SECTION --- */}
      {/* This div positions the splash characters at the bottom of the screen */}
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
      {/* --- END OF ADDED SECTION --- */}
    </div>
  );
}
