import { GameProvider } from "../GameProvider";

interface LayoutProps {
    children: React.ReactNode;
    params: Promise<{ gameId: string }>;
}

export default async function GameIdLayout({
    children,
    params,
}: LayoutProps) {
    const { gameId } = await params;
    const gameIdNum = Number(gameId);

    return (
        <GameProvider gameId={isNaN(gameIdNum) ? undefined : gameIdNum}>
            {children}
        </GameProvider>
    );
}
