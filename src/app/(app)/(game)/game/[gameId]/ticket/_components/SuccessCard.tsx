import Image from "next/image";
import { GameSummaryCard } from "./GameSummary";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { notify } from "@/components/ui/Toaster";
import { useCallback } from "react";
import { env } from "@/lib/env";
import { useComposeCast } from "@coinbase/onchainkit/minikit";
import { Ticket } from "@/lib/db";

export const SuccessCard = ({
  theme,
  prizePool,
  fid,
  gameId,
  ticket,
}: {
  theme: string;
  prizePool: number;
  fid: number;
  gameId: number;
  ticket: Ticket | null;
}) => {
  const { composeCastAsync } = useComposeCast();

  const shareTicket = useCallback(async () => {
    if (!ticket) return;
    try {
      const message = `Just secured my waffle ticket  🧇`;
      const result = await composeCastAsync({
        text: message,
        embeds: [
          `${env.rootUrl}/game/${gameId}/ticket?fid=${fid}&ticketCode=${ticket.code}`,
        ].filter(Boolean) as [],
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
  }, [composeCastAsync, fid, gameId, ticket]);

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
        <GameSummaryCard theme={theme} prizePool={prizePool} />
        <button
          onClick={shareTicket}
          className={cn(
            "mt-8 w-full rounded-[14px] bg-white px-6 py-4 text-center font-body text-2xl text-[#FB72FF]",
            "border-r-[5px] border-b-[5px] border-[#FB72FF] transition active:translate-x-[2px] active:translate-y-[2px]"
          )}
        >
          SHARE TICKET
        </button>
        <Link
          href={`/game?fid=${fid}`}
          className="mt-6 text-sm font-body uppercase text-[#00CFF2] transition hover:text-[#33defa]"
        >
          BACK TO HOME
        </Link>
      </div>
    </div>
  );
};
