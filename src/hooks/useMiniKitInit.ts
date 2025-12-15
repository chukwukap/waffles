import { useMiniKit } from "@coinbase/onchainkit/minikit";

/**
 * Hook to access MiniKit ready state.
 * NOTE: Don't call setMiniAppReady here - AuthGate handles that
 * after checking user status (so Farcaster splash stays until ready).
 */
export function useMiniKitInit() {
  const { isMiniAppReady } = useMiniKit();
  return { isMiniAppReady };
}
