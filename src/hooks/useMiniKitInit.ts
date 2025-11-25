import { useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

/**
 * Hook to ensure MiniKit is initialized when the app loads.
 * Call this in the top-level provider or layout.
 */
export function useMiniKitInit() {
  const { isMiniAppReady, setMiniAppReady } = useMiniKit();
  const [forceReady, setForceReady] = useState(false);

  useEffect(() => {
    console.log("[MiniKit Init] isMiniAppReady:", isMiniAppReady);

    if (!isMiniAppReady) {
      console.log("[MiniKit Init] Calling setMiniAppReady()");
      setMiniAppReady();
    }

    // Fallback: if MiniKit doesn't become ready within 3 seconds, force ready
    const timeout = setTimeout(() => {
      if (!isMiniAppReady) {
        console.warn("[MiniKit Init] Timeout reached, forcing ready state");
        setForceReady(true);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isMiniAppReady, setMiniAppReady]);

  return { isMiniAppReady: isMiniAppReady || forceReady };
}
