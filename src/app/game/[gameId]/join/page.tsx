import JoinGameClient from "./client";

export default async function JoinGamePage({
  searchParams,
}: {
  searchParams: Promise<{ gameId: string; fid: string }>;
}) {
  const { gameId, fid } = await searchParams;

  return <JoinGameClient gameId={gameId} />;
}
