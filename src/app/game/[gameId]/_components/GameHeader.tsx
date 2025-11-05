"use client";
import { LeaveGameIcon } from "@/components/icons";
import LogoIcon from "@/components/logo/LogoIcon";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";
import { useGetTokenBalance } from "@coinbase/onchainkit/wallet";
import { WalletIcon } from "lucide-react";
import { base } from "viem/chains";
import { useAccount } from "wagmi";
import { NeccessaryGameInfo, NeccessaryUserInfo } from "../page";
import { use, useCallback, useState } from "react";
import LeaveGameDrawer from "./LeaveGameDrawer";
import { leaveGameAction } from "@/actions/game";
import { useRouter } from "next/navigation";
import { notify } from "@/components/ui/Toaster";

export function GameHeader({
  userInfoPromise,
  gameInfoPromise,
}: {
  userInfoPromise: Promise<NeccessaryUserInfo | null>;
  gameInfoPromise: Promise<NeccessaryGameInfo | null>;
}) {
  const userInfo = use(userInfoPromise);
  const gameInfo = use(gameInfoPromise);

  const router = useRouter();
  const { address } = useAccount();
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
      await leaveGameAction({
        fid: userInfo?.fid ?? 0,
        gameId: gameInfo?.id ?? 0,
      });
      setIsLeaveGameDrawerOpen(false);
      router.refresh();
    } catch {
      notify.error("Failed to leave game:");
      setIsLeaveGameDrawerOpen(false);
    }
  }, [userInfo?.fid, gameInfo?.id, router]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 px-4 flex items-center justify-between border-b border-border backdrop-blur-sm"
        )}
      >
        <LogoIcon />
        <div className="flex items-center gap-2">
          {userInfo?._count.gameParticipants &&
          userInfo._count.gameParticipants > 0 ? (
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
