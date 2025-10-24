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

    const ticketRecord = await prisma.ticket.findUnique({
      where: {
        gameId_userId: {
          gameId,
          userId: user.id,
        },
      },
    });
    if (!ticketRecord) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }
    if (ticketRecord.usedAt) {
      return NextResponse.json(
        { error: "Game already completed" },
        { status: 400 }
      );
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { config: true },
    });
    if (!game)
      return NextResponse.json({ error: "Game not found" }, { status: 404 });

    const roundLimit = game.config?.roundTimeLimit ?? 15;
    const maxTime =
      Number.isFinite(roundLimit) && roundLimit > 0 ? roundLimit : 15;
    const sanitizedTime = Math.min(
      Math.max(0, Number(timeTaken) || 0),
      maxTime
    );
    const correct = selected === question.correctAnswer;
    const newPoints = correct ? calculateScore(sanitizedTime, maxTime) : 0;

    await prisma.$transaction(async (tx) => {
      const previousAnswer = await tx.answer.findUnique({
        where: {
          userId_gameId_questionId: { userId: user.id, gameId, questionId },
        },
      });

      const previousPoints =
        previousAnswer?.isCorrect && Number.isFinite(previousAnswer.timeTaken)
          ? calculateScore(previousAnswer.timeTaken, maxTime)
          : 0;

      await tx.answer.upsert({
        where: {
          userId_gameId_questionId: { userId: user.id, gameId, questionId },
        },
        update: {
          selected,
          isCorrect: correct,
          timeTaken: sanitizedTime,
        },
        create: {
          userId: user.id,
          gameId,
          questionId,
          selected,
          isCorrect: correct,
          timeTaken: sanitizedTime,
        },
      });

      const existingScore = await tx.score.findUnique({
        where: { userId_gameId: { userId: user.id, gameId } },
      });

      const delta = newPoints - previousPoints;

      if (existingScore) {
        const nextPoints = Math.max(0, existingScore.points + delta);
        await tx.score.update({
          where: { userId_gameId: { userId: user.id, gameId } },
          data: { points: nextPoints },
        });
      } else {
        await tx.score.create({
          data: { userId: user.id, gameId, points: newPoints },
        });
      }
    });

    return NextResponse.json({ correct, points: newPoints });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
