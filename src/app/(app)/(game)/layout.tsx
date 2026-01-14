/**
 * Game Layout
 *
 * Pure structural layout - no data fetching, no providers.
 * - AccessGuard handles user access control
 * - GameHeader renders based on pathname only
 * - Each page handles its own RealtimeProvider and data fetching
 */

import { GameHeader } from "./game/_components/GameHeader";
import { AccessGuard } from "@/components/providers/AccessGuard";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AccessGuard>
      <GameHeader />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </div>
    </AccessGuard>
  );
}

// Force dynamic rendering for access control
export const dynamic = "force-dynamic";
