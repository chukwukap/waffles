import { GameHeader } from "./game/_components/GameHeader";
import { GameSocketProvider } from "@/components/providers/GameSocketProvider";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GameSocketProvider>
      <GameHeader />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </div>
    </GameSocketProvider>
  );
}
