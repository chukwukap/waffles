import { GameHeader } from "./_components/GameHeader";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <GameHeader />
      <main className="w-full min-h-dvh flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
