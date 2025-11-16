"use client";
import { LeaveGameIcon } from "@/components/icons";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";
import { useGetTokenBalance } from "@coinbase/onchainkit/wallet";
import { WalletIcon } from "lucide-react";
import { base } from "viem/chains";
import { useAccount } from "wagmi";
import { useState } from "react";
import LeaveGameDrawer from "./LeaveGameDrawer";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";

export function GameHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const gameId = Number(searchParams.get("gameId"));
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

  // Detect if we are on the /live route
  const isLiveRoute = pathname?.includes("/live");

  return (
    <>
      <header
        className={cn(
          "sticky top-0 left-0 shrink-0 z-40 flex items-center justify-between w-[393px] h-[52px] bg-[#191919] border-b border-b-[#FFFFFF12] pt-[12px] px-4 pb-[12px]"
        )}
      >
        {isLiveRoute ? (
          <div className="flex items-center gap-2">
            <div className="relative w-[29.96px] h-[23.24px]">
              <Image
                src="/logo.png"
                alt="Live game logo"
                fill
                sizes="29.96px"
                priority
                className="object-contain"
              />
            </div>
            {/* red glowing point */}
            <span className="flex items-center gap-1.5 mr-auto">
              <span
                className="w-2 h-2 rounded-full bg-[#FC1919] animate-pulse"
                style={{
                  boxShadow:
                    "0 0 6px rgba(252, 25, 25, 0.8), 0 0 12px rgba(252, 25, 25, 0.4)",
                }}
              />
              <span className="text-[#FC1919] text-[18px] not-italic font-normal leading-[92%] tracking-[-0.03em]">
                Live
              </span>
            </span>
          </div>
        ) : (
          <div className="relative w-[122.56px] h-[23.29px]">
            <Image
              src="/logo-onboarding.png"
              alt="Waffles logo icon"
              fill
              sizes="122.56px"
              priority
              className="object-contain"
            />
          </div>
        )}

        {isLiveRoute ? (
          // Always show the Leave Game button on the /live route
          <button
            onClick={() => setIsLeaveGameDrawerOpen(true)}
            className="flex items-center bg-white/10 rounded-full px-[12px] py-[6px] w-[130.9916px] h-[28px] hover:bg-white/20 transition-colors font-body"
          >
            <LeaveGameIcon className="w-[15px] h-[15px] mr-2" />
            <span className="text-[16px] leading-[100%] text-center text-white">
              leave game
            </span>
          </button>
        ) : (
          <div className="flex items-center  px-3 py-1.5 rounded-full bg-[#F9F9F91A] font-body">
            <WalletIcon className="w-[12px] h-[10.8px] opacity-100 text-white mr-1" />

            <span className="text-center font-normal not-italic text-[16px] leading-[100%] tracking-[0px] text-white">
              {`$${Number(roundedBalance).toFixed(2)}`}
            </span>
          </div>
        )}
      </header>

      <LeaveGameDrawer
        open={isLeaveGameDrawerOpen}
        setIsLeaveGameDrawerOpen={setIsLeaveGameDrawerOpen}
        gameId={gameId!}
      />
    </>
  );
}
