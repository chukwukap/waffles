"use client";
import { useCallback } from "react";
import { useComposeCast, useMiniKit } from "@coinbase/onchainkit/minikit";
import { notify } from "@/components/ui/Toaster";
import { env } from "@/lib/env";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";

export function ShareButton({
  className,
  disabled,
}: {
  className?: string;
  disabled?: boolean;
}) {
  const { context: miniKitContext } = useMiniKit();
  const userFid = miniKitContext?.user?.fid;
  const { composeCastAsync } = useComposeCast();
  const share = useCallback(async () => {
    const message = `I'm on the Waffles waitlist! Join me!`;
    notify.info("Opening Farcaster composer...");
    try {
      const result = await composeCastAsync({
        text: message,
        embeds: [`${env.rootUrl ?? ""}/waitlist?ref=${userFid}`],
      });
      if (result?.cast) {
        notify.success("Shared successfully!");
      } else {
        notify.info("Share cancelled.");
      }
    } catch {
      notify.error("Failed to share waitlist.");
    }
  }, [composeCastAsync, userFid]);
  return (
    <FancyBorderButton
      onClick={share}
      className={className}
      disabled={disabled}
    >
      SHARE
    </FancyBorderButton>
  );
}
