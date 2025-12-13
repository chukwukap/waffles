import { SubHeader } from "@/components/ui/SubHeader";
import GameDetailsClient from "./client";

// Server component just renders client with game ID from route
export default async function GameDetailsPage({
    params,
}: {
    params: Promise<{ gameId: string }>;
}) {
    const { gameId } = await params;
    const gameIdNum = Number(gameId);

    return (
        <>
            <SubHeader title="GAME DETAILS" />
            <GameDetailsClient gameId={gameIdNum} />
        </>
    );
}