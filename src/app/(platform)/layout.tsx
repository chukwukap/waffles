import { GameHeader } from "./game/_components/GameHeader";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="h-dvh flex flex-col overflow-hidden">
      <GameHeader />
      {children}
    </main>
  );
}
