"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function RootPageClient() {
  const { context: miniKitContext } = useMiniKit();
  const fid = miniKitContext?.user?.fid;
  const router = useRouter();
  useEffect(() => {
    router.push(`/waitlist?fid=${fid}`);
  }, [router, fid]);
  return null;
}
