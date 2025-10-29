"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";

export interface MiniUser {
  fid: number | null;
  username: string | null;
  pfpUrl: string | null;
  wallet: `0x${string}` | null;
  isConnected: boolean;
  isMiniAppReady: boolean;
}

const mockUser: MiniUser = {
  fid: 755074,
  username: "chukwukauba",
  pfpUrl:
    "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/3d4b3ff7-3ed7-4522-125a-9419a85ada00/original",
  wallet: "0xMockAddress1234567890abcdef1234567890abcd",
  isConnected: true,
  isMiniAppReady: true,
};

export function useMiniUser(): MiniUser {
  const { context: miniKitContext, isMiniAppReady } = useMiniKit();
  const { address, isConnected } = useAccount();

  const fid = miniKitContext?.user?.fid ?? null;
  const username = miniKitContext?.user?.username ?? null;
  const pfpUrl = miniKitContext?.user?.pfpUrl ?? null;
  const wallet = address ?? null;

  const realUser: MiniUser = {
    fid,
    username,
    pfpUrl,
    wallet,
    isConnected,
    isMiniAppReady,
  };

  if (process.env.NODE_ENV === "production" && !realUser.fid) {
    // Clear, visible warning in production if no FID

    console.warn(
      "[useMiniUser] WARNING: User FID is required in production but was not found. MiniApp context:",
      miniKitContext
    );
  }

  const useMock = process.env.NODE_ENV !== "production" && !realUser.fid;

  return useMock ? mockUser : realUser;
}
