import { redirect } from "next/navigation";

/**
 * /game/[gameId] - Redirect to main game hub
 * 
 * With the new architecture, all game interaction happens at /game.
 * This route exists for backwards compatibility and deep links.
 */
export default async function GameDetailsPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  // Simply redirect to the main game page
  // The game hub will show the current/next game
  redirect("/game");
}
