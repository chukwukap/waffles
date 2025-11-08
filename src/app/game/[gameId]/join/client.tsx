"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CardStack } from "@/components/CardStack";

import { useRouter } from "next/navigation";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { cn } from "@/lib/utils";
import { joinGameAction } from "@/actions/game";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

export default function JoinGameClient({
  gameId,
  joinedCount,
}: {
  gameId: string;
  joinedCount: number;
}) {
  const router = useRouter();
  const { context: miniKitContext } = useMiniKit();
  const fid = miniKitContext?.user?.fid;
  const handleJoin = async () => {
    const result = await joinGameAction({
      fid: Number(fid),
      gameId: Number(gameId),
    });
    if (result.success) {
      router.push(`/game/${gameId}/live?gameId=${gameId}&fid=${fid}`);
    } else {
      console.error("Failed to join game:", result.error);
    }
  };

  const joinedLabel = joinedCount === 1 ? "person has" : "people have";

  const isDisabledByLoadingOrError = false;

  return (
    <div className="relative flex h-[90dvh] w-full overflow-hidden bg-black text-white">
      <Image
        src="/images/game-hero.gif"
        alt="Game background animation"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/60 to-black/95 pointer-events-none" />

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end px-6 pb-10 gap-6 pointer-events-none">
        <motion.div className="pointer-events-auto w-full max-w-sm">
          <FancyBorderButton
            aria-label="JOIN GAME"
            disabled={isDisabledByLoadingOrError}
            onClick={handleJoin}
            className={cn(
              "w-full rounded-[18px] border-b-[6px] border-r-[6px] border-[#FFC931] bg-white px-6 py-4 text-center shadow-[0_6px_0_0_#FFC931] transition",
              isDisabledByLoadingOrError && "opacity-60 cursor-not-allowed"
            )}
          >
            <span className="block font-body text-2xl leading-none text-[#F5BB1B]">
              JOIN GAME
            </span>
          </FancyBorderButton>
          {/* {statsError && !isLoadingStats && ( */}
          {/* <p className="text-center text-red-400 text-xs mt-2 pointer-events-auto">
              {" "}
              {statsError.message || "Could not load player count."}
            </p>
          )} */}
        </motion.div>

        <div className="flex items-center justify-center gap-3 pointer-events-auto">
          <CardStack
            images={[
              {
                src: "/images/avatars/a.png",
              },
              {
                src: "/images/avatars/b.png",
              },
              {
                src: "/images/avatars/c.png",
              },
              {
                src: "/images/avatars/d.png",
              },
            ]}
            size="clamp(32px, 7vw, 52px)"
            rotations={[-8.7, 5.85, -3.57, 7.56]}
            ariaLabel={`${joinedCount} players have joined`}
          />
          <span className="text-sm font-body text-[#DBE0F0]">
            {joinedCount} {joinedLabel} joined the game
          </span>
        </div>
      </div>
    </div>
  );
}
