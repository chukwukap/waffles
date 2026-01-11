import { GameHeader } from "./game/_components/GameHeader";
import { GameProvider } from "@/components/providers/GameProvider";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GameProvider>
      <GameHeader />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </div>
    </GameProvider>
  );
}
