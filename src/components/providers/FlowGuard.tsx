"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useGame, useLobby } from "@/state";
import { useMiniUser } from "@/hooks/useMiniUser";
import { SplashScreen } from "../ui/SplashScreen";

const ALLOW_LIST_WITHOUT_INVITE = new Set(["/lobby/invite-code"]);

export function FlowGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isFrameReady } = useMiniKit();
  const [frameAcknowledged, setFrameAcknowledged] = useState(false);
  const { fid } = useMiniUser();
  const { game } = useGame();
  const {
    inviteStatusLoaded,
    hasValidInvite,
    fetchReferralStatus,
    ticket,
    fetchTicket,
  } = useLobby();

  useEffect(() => {
    if (!isFrameReady) {
      const timer = setTimeout(() => setFrameAcknowledged(true), 3000); // 3 seconds
      return () => clearTimeout(timer);
    }
    // setFrameAcknowledged(true);
  }, [isFrameReady]);

  useEffect(() => {
    if (!fid || !frameAcknowledged) return;
    fetchReferralStatus(String(fid));
  }, [fid, frameAcknowledged, fetchReferralStatus]);

  useEffect(() => {
    if (!fid || !game?.id || !frameAcknowledged) return;
    fetchTicket(String(fid), game.id);
  }, [fid, frameAcknowledged, game?.id, fetchTicket]);

  const redirect = useCallback(
    (target: string) => {
      if (pathname === target) return;
      router.replace(target);
    },
    [pathname, router]
  );

  useEffect(() => {
    if (!fid || !inviteStatusLoaded || !frameAcknowledged) return;

    if (!hasValidInvite) {
      if (!ALLOW_LIST_WITHOUT_INVITE.has(pathname)) {
        redirect("/lobby/invite-code");
      }
      return;
    }

    if (pathname === "/lobby/invite-code") {
      redirect("/lobby/buy");
      return;
    }

    if (!ticket) {
      if (pathname === "/game") {
        redirect("/lobby/buy");
        return;
      }
      if (pathname === "/") {
        redirect("/lobby/buy");
        return;
      }
    } else {
      if (
        pathname === "/" ||
        pathname === "/lobby" ||
        pathname === "/lobby/buy"
      ) {
        redirect("/game");
        return;
      }
    }
  }, [fid, inviteStatusLoaded, hasValidInvite, ticket, pathname, redirect]);

  if (!frameAcknowledged) {
    return <SplashScreen />;
  }

  const blockingInvite =
    inviteStatusLoaded &&
    !hasValidInvite &&
    !ALLOW_LIST_WITHOUT_INVITE.has(pathname);
  const blockingTicket = hasValidInvite && !ticket && pathname === "/game";

  if (blockingInvite || blockingTicket) {
    return null;
  }

  return <>{children}</>;
}
