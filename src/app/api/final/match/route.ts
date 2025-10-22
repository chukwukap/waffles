import { prisma } from "@/server/db";
import { isMatch } from "@/lib/scoring";

export async function POST(req: Request) {
  try {
    const { userId, gameId, choiceId, targetId } = await req.json();
    if (!userId || !gameId)
      return Response.json({ error: "Missing fields" }, { status: 400 });

    const correct = isMatch(choiceId, targetId);
    const points = correct ? 100 : 0;

    await prisma.score.upsert({
      where: { userId_gameId: { userId, gameId } },
      update: { points: { increment: points } },
      create: { userId, gameId, points },
    });

    return Response.json({ correct, points });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
