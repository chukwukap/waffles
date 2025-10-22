import { prisma } from "@/lib/db";
import { calculateScore } from "@/lib/scoring";

export async function POST(req: Request) {
  try {
    const { userId, gameId, questionId, selected, timeTaken } =
      await req.json();

    if (!userId || !gameId || !questionId || !selected)
      return Response.json({ error: "Missing fields" }, { status: 400 });

    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question)
      return Response.json({ error: "Question not found" }, { status: 404 });

    const correct = selected === question.correctAnswer;
    const points = correct ? calculateScore(timeTaken, 10) : 0;

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
