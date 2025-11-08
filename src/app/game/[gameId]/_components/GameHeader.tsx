"use client";
import { LeaveGameIcon } from "@/components/icons";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";
import { useGetTokenBalance } from "@coinbase/onchainkit/wallet";
import { WalletIcon } from "lucide-react";
import { base } from "viem/chains";
import { useAccount } from "wagmi";
import { useCallback, useState } from "react";
import LeaveGameDrawer from "./LeaveGameDrawer";
import { leaveGameAction } from "@/actions/game";
import { useRouter, usePathname } from "next/navigation";
import { notify } from "@/components/ui/Toaster";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import Image from "next/image";

export function GameHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { address } = useAccount();
  const { context } = useMiniKit();
  const { roundedBalance } = useGetTokenBalance(address as `0x${string}`, {
    address: env.nextPublicUsdcAddress as `0x${string}`,
    decimals: 6,
    name: "USDC",
    symbol: "USDC",
    image: "/images/tokens/usdc.png",
    chainId: base.id,
  });

  const [isLeaveGameDrawerOpen, setIsLeaveGameDrawerOpen] = useState(false);

  const leaveGame = useCallback(async () => {
    try {
      if (!context?.user.fid) {
        notify.error("Failed to leave game: No FID found.");
        return;
      }
      await leaveGameAction({ fid: context?.user.fid });
      setIsLeaveGameDrawerOpen(false);
      router.refresh();
    } catch {
      notify.error("Failed to leave game:");
      setIsLeaveGameDrawerOpen(false);
    }
  }, [context?.user.fid, router]);

  // Detect if we are on the /live route
  const isLiveRoute = pathname?.includes("/live");

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 px-4 py-2 flex items-center justify-between border-b border-border backdrop-blur-sm"
        )}
      >
        <div
          className={
            isLiveRoute
              ? "relative w-[84px] h-[24px] flex items-center"
              : "relative w-[148px] h-[60px]"
          }
        >
          {isLiveRoute ? (
            <Image
              src="/logo-live.svg"
              alt="Live game logo"
              fill
              sizes="(max-width: 640px) 84px, 84px"
              priority
              className="object-contain"
            />
          ) : (
            <Image
              src="/logo-onboarding.png"
              alt="Waffles logo icon"
              fill
              sizes="(max-width: 640px) 148px, 148px"
              priority
              className="object-contain"
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLiveRoute ? (
            // Always show the Leave Game button on the /live route
            <button
              onClick={() => setIsLeaveGameDrawerOpen(true)}
              className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 text-xs text-foreground hover:bg-white/20 transition-colors"
            >
              <LeaveGameIcon className="w-4 h-4" />
              <span>leave game</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5  rounded-full px-3 py-1.5 border border-white/10">
              <WalletIcon className="w-4 h-4 text-foreground" />
              <span className="text-xs text-foreground">
                {`$${roundedBalance}`}
              </span>
            </div>
          )}
        </div>
      </header>
      <LeaveGameDrawer
        open={isLeaveGameDrawerOpen}
        onClose={() => setIsLeaveGameDrawerOpen(false)}
        onConfirmLeave={leaveGame}
      />
    </>
  );
}
