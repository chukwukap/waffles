import { GameHeader } from "./game/_components/GameHeader";
import { GameAuthGate } from "./game/_components/GameAuthGate";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GameAuthGate>
      <GameHeader />
      {children}
    </GameAuthGate>
  );
}
