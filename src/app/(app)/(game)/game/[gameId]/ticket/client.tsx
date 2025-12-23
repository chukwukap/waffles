"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { BottomNav } from "@/components/BottomNav";

import { TicketPageGameInfo } from "./page";

/**
 * TicketPage - DEPRECATED (redirects to game hub)
 *
 * Ticket purchases now happen via modal on the game hub.
 * The success page (/ticket/success) is still used for Farcaster embeds.
 *
 * If anyone lands here, redirect them to the game hub.
 */
export default function TicketPageClient({
  gameInfo,
}: {
  gameInfo: TicketPageGameInfo;
}) {
  const router = useRouter();

  useEffect(() => {
    // Redirect to game hub - all purchases happen via modal now
    router.replace("/game");
  }, [router]);

  return (
    <>
      <div className="flex-1 flex items-center justify-center">
        <WaffleLoader text="REDIRECTING..." />
      </div>
      <BottomNav />
    </>
  );
}
