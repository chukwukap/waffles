// ───────────────────────── /app/api/profile/history/route.ts ─────────────────────────
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const farcasterId = request.headers.get("x-farcaster-id");
  if (!farcasterId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { farcasterId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const scores = await prisma.score.findMany({
    where: { userId: user.id },
    include: { game: true },
    orderBy: { game: { endTime: "desc" } },
  });

  const history = scores.map((s, index) => ({
    id: s.id,
    name: s.game.title,
    score: s.points,
    winnings: s.points,
    winningsColor: s.points > 0 ? "green" : "gray",
  }));

  return NextResponse.json(history);
}
