"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Root page component for the application.
 * Immediately redirects users to the main lobby view ('/lobby').
 * This is handled server-side for efficiency.
 */
export default function Home() {
  const { context: miniKitContext } = useMiniKit();
  const fid = miniKitContext?.user?.fid;
  const router = useRouter();
  useEffect(() => {
    router.replace(`/lobby?fid=${fid}`);
  }, [router, fid]);
  return null;
}
