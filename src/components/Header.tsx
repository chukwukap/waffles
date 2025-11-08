"use client";
import Image from "next/image";
import { WalletIcon } from "@/components/icons";
import { useGetTokenBalance } from "@coinbase/onchainkit/wallet";
import { useAccount } from "wagmi";
import { base } from "viem/chains";
import { env } from "@/lib/env";

export default function Header() {
  const account = useAccount();

  const { roundedBalance, status } = useGetTokenBalance(
    account.address as `0x${string}`,
    {
      address: env.nextPublicUsdcAddress as `0x${string}`,
      chainId: base.id,
      decimals: 6,
      image: "/images/tokens/usdc.png",
      name: "USDC",
      symbol: "USDC",
    }
  );
  return (
    <header className="sticky top-0 z-10 w-full border-b border-white/20 px-4 app-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-screen-sm flex w-full items-center justify-between">
        <div className="flex min-w-0 flex-row items-center justify-center">
          <Image src="/images/logo.svg" alt="Logo" width={32} height={32} />
        </div>
        <div className="flex items-center">
          <div className="flex h-7 min-w-[64px] flex-row items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 border border-white/10">
            <WalletIcon className="h-4 w-4 text-foreground" />
            <span
              className="font-edit-undo leading-[1.1] text-foreground text-center tabular-nums"
              style={{ fontSize: "clamp(0.9rem, 1.8vw, .95rem)" }}
            >
              {status === "pending" ? "---" : `$${roundedBalance}`}{" "}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
