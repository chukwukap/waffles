import { GameClientImpl } from "./gameClientImpl";
import React from "react";
import { fetchGameById, fetchUserWithGameDetailsAndReferral } from "@/lib/data";
import { getCurrentUserFid } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";

export default async function GamePage(props: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await props.params;

  const userFid = await getCurrentUserFid();
  if (!userFid) {
    return null;
  }
  const numericGameId = Number(gameId);
  const game = await fetchGameById(numericGameId);

  if (!game) {
    // No such game
    return notFound();
  }

  const userInfo = await fetchUserWithGameDetailsAndReferral(
    userFid,
    numericGameId
  );

  if (!userInfo) {
    // No such user game details found
    return notFound();
  }

  // Server-side "game over" check:
  const now = new Date();
  const end = new Date(game.endTime);

  const isGameOver =
    now > end ||
    (userInfo.answers?.length ?? 0) === (game.questions?.length ?? 0);

  if (isGameOver) {
    // Redirect to score page if the game is over for this user
    redirect(`/game/${game.id}/score`);
  }

  // Check for user ticket: participants are only allowed in with a ticket
  const userTicket = userInfo.tickets?.find((t) => t.gameId === game.id);
  if (!userTicket) {
    // Redirect to the lobby if user does not have a ticket for the game
    redirect("/lobby");
  }

  // If all checks pass, render the client game component
  return <GameClientImpl game={game} userInfo={userInfo} />;
}

export const dynamic = "force-dynamic";
