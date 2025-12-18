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

