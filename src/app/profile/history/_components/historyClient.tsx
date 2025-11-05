import { cn } from "@/lib/utils";
import GameHistoryItem from "../../_components/GameHistoryItem";
import { GameHistoryEntry } from "@/state/types";
import { use } from "react";

export default function HistoryClient({
  payloadPromise,
}: {
  payloadPromise: Promise<GameHistoryEntry[]>;
}) {
  const gameHistory = use(payloadPromise);
  return (
    <main
      className={cn(
        "mx-auto w-full max-w-lg",
        "px-4",
        "pb-[calc(env(safe-area-inset-bottom)+84px)]",
        "mt-4 flex-1"
      )}
    >
      {gameHistory && gameHistory.length > 0 && (
        <ul className="flex flex-col gap-3.5 sm:gap-4">
          {gameHistory.map((g) => (
            <li key={g.id}>
              <GameHistoryItem game={g} />
            </li>
          ))}
        </ul>
      )}

      {(!gameHistory || gameHistory.length === 0) && (
        <div className="panel rounded-2xl p-6 text-center text-sm text-muted mt-6">
          You haven&apos;t played any games yet.
        </div>
      )}
    </main>
  );
}
