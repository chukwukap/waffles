/**
 * Game Layout
 *
 * Pure structural layout - no data fetching, no providers.
 * - GameHeader renders based on pathname only
 * - Each page handles its own RealtimeProvider and data fetching
 */

import { GameHeader } from "./game/_components/GameHeader";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GameHeader />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </div>
    </>
  );
}

// Force dynamic rendering
export const dynamic = "force-dynamic";
