"use client";
import { useCallback } from "react";
import { useComposeCast } from "@coinbase/onchainkit/minikit";
import { notify } from "@/components/ui/Toaster";
import { env } from "@/lib/env";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";

export function ShareButton({
  userFid,
  className,
}: {
  userFid: number;
  className?: string;
}) {
  const { composeCastAsync } = useComposeCast();
  const share = useCallback(async () => {
    const message = `I'm on the Waffles waitlist! Join me at ${window.location.origin}/waitlist?ref=${userFid}`;
    notify.info("Opening Farcaster composer...");
    try {
      const result = await composeCastAsync({
        text: message,
        embeds: [env.rootUrl ? { url: env.rootUrl } : undefined].filter(
          Boolean
        ) as unknown as [string],
      });
      if (result?.cast) {
        notify.success("Shared successfully!");
      } else {
        notify.info("Share cancelled.");
      }
    } catch {
      notify.error("Failed to share waitlist.");
    }
  }, [userFid, composeCastAsync]);
  return (
    <FancyBorderButton onClick={share} className={className}>
      SHARE
    </FancyBorderButton>
  );
}
