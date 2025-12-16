import { GameHeader } from "./game/_components/GameHeader";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GameHeader />
      {children}
    </>
  );
}
