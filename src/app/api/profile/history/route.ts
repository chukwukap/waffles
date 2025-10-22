import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/profile/history
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
    orderBy: { game: { endTime: "asc" } },
  });
  const history = scores.map((s, index) => ({
    round: `Round ${index + 1}`,
    winnings: s.points,
  }));
  return NextResponse.json(history);
}
