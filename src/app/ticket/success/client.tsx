"use client";

import { useCallback, useMemo, use } from "react";
import { useComposeCast } from "@coinbase/onchainkit/minikit";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { GameSummaryCard } from "../_components/GameSummary";
import Link from "next/link";
import { env } from "@/lib/env";
import { notify } from "@/components/ui/Toaster";

import { TicketSuccessGameInfo, TicketSuccessUserInfo } from "./page";

type TicketSuccessClientProps = {
  gameInfoPromise: Promise<TicketSuccessGameInfo>;
  userInfoPromise: Promise<TicketSuccessUserInfo | null>;
};

export default function TicketSuccessClient({
  gameInfoPromise,
  userInfoPromise,
}: TicketSuccessClientProps) {
  const gameInfo = use(gameInfoPromise);
  const userInfo = use(userInfoPromise);

  const { composeCastAsync } = useComposeCast();

  // Calculate prize pool
  const prizePool = useMemo(() => {
    const ticketPrice = gameInfo?.config?.ticketPrice ?? 50;
    const additionPrizePool = gameInfo?.config?.additionPrizePool ?? 0;
    const calculatedPool =
      gameInfo._count.tickets * ticketPrice + additionPrizePool;
    return calculatedPool;
  }, [gameInfo]);

  const theme = useMemo(() => {
    return gameInfo?.config?.theme ? gameInfo.config.theme : "FOOTBALL";
  }, [gameInfo?.config?.theme]);

  const shareTicket = useCallback(async () => {
    if (!userInfo?._count.tickets || !gameInfo) return;

    try {
      const message = `Just secured my waffle ticket for ${gameInfo.name}! 🧇`;
      const result = await composeCastAsync({
        text: message,
        embeds: [env.rootUrl ? { url: env.rootUrl } : undefined].filter(
          Boolean
        ) as [],
      });

      if (result?.cast) {
        notify.success("Shared successfully!");
        console.log("Cast created successfully:", result.cast.hash);
      } else {
        notify.info("Cast cancelled.");
        console.log("User cancelled the cast");
      }
    } catch (error) {
      console.error("Error sharing cast:", error);
      notify.error("Unable to share your ticket right now.");
    }
  }, [userInfo?._count.tickets, gameInfo, composeCastAsync]);

  return (
    <div className="flex-1 flex flex-col items-center gap-3 justify-center overflow-y-auto pt-1">
      <div className="mx-auto flex w-full max-w-[420px] flex-col items-center px-5 pb-10">
        <Image
          src="/images/illustrations/waffles.svg"
          alt="Pixel waffle"
          width={200}
          height={100}
          priority
          className="mb-5 h-auto w-[150px]"
        />
        <h1
          className="text-foreground text-center font-body"
          style={{
            fontSize: "42px",
            lineHeight: "0.92",
            letterSpacing: "-0.03em",
          }}
        >
          WAFFLE SECURED!
        </h1>
        <p className="mt-3 text-center text-base font-display text-[#99A0AE]">
          You&apos;re in. See you Friday.
        </p>
        <GameSummaryCard
          avatarUrl={userInfo?.imageUrl || "/images/avatars/a.png"}
          username={userInfo?.name || "Player"}
          theme={theme}
          prizePool={prizePool}
        />
        <button
          onClick={shareTicket}
          className={cn(
            "mt-8 w-full rounded-[14px] bg-white px-6 py-4 text-center font-edit-undo text-2xl text-[#FB72FF]",
            "border-r-[5px] border-b-[5px] border-[#FB72FF] transition active:translate-x-[2px] active:translate-y-[2px]"
          )}
        >
          SHARE TICKET
        </button>
        <Link
          href={`/game/${gameInfo.id}?fid=${userInfo?.fid ?? 0}`}
          className="mt-6 text-sm font-body uppercase text-[#00CFF2] transition hover:text-[#33defa]"
        >
          BACK TO HOME
        </Link>
      </div>
    </div>
  );
}

