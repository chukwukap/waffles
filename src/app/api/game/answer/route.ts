import { prisma } from "@/lib/db";
import { calculateScore } from "@/lib/scoring";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { farcasterId, gameId, questionId, selected, timeTaken } =
      await req.json();

    if (!farcasterId || !gameId || !questionId || !selected)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { farcasterId: String(farcasterId) },
    });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question)
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );

    const correct = selected === question.correctAnswer;
    const points = correct ? calculateScore(timeTaken, 10) : 0;

    // record per-question answer and update score

    await prisma.$transaction([
      prisma.answer.upsert({
        where: {
          userId_gameId_questionId: { userId: user.id, gameId, questionId },
        },
        update: {
          selected,
          isCorrect: correct,
          timeTaken: Math.max(0, Number(timeTaken) || 0),
        },
        create: {
          userId: user.id,
          gameId,
          questionId,
          selected,
          isCorrect: correct,
          timeTaken: Math.max(0, Number(timeTaken) || 0),
        },
      }),
      prisma.score.upsert({
        where: { userId_gameId: { userId: user.id, gameId } },
        update: { points: { increment: points } },
        create: { userId: user.id, gameId, points },
      }),
    ]);

    return NextResponse.json({ correct, points });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
