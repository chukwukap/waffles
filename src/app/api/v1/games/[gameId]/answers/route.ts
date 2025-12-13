import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { calculateScore, QuestionDifficulty } from "@/lib/scoring";

type Params = { gameId: string };

const submitAnswerSchema = z.object({
  questionId: z.number().int().positive("Invalid Question ID"),
  selectedIndex: z.number().int().nullable().optional(),
  timeTakenMs: z.number().nonnegative("Time taken cannot be negative"),
});

interface SubmitAnswerResponse {
  success: boolean;
  isCorrect: boolean;
  pointsEarned: number;
  totalScore: number;
}

/**
 * POST /api/v1/games/[gameId]/answers
 * Submit an answer for a question in the game (auth required)
 */
export const POST = withAuth<Params>(
  async (request, auth: AuthResult, params) => {
    try {
      const gameIdNum = parseInt(params.gameId, 10);

      if (isNaN(gameIdNum)) {
        return NextResponse.json<ApiError>(
          { error: "Invalid game ID", code: "INVALID_PARAM" },
          { status: 400 }
        );
      }

      // Parse request body
      const body = await request.json();
      const validation = submitAnswerSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json<ApiError>(
          {
            error: validation.error.issues[0]?.message || "Invalid input",
            code: "VALIDATION_ERROR",
          },
          { status: 400 }
        );
      }

      const { questionId, selectedIndex, timeTakenMs } = validation.data;
      const selectedIndexValue = selectedIndex ?? -1;

      // Verify user is a player in this game
      const gamePlayer = await prisma.gamePlayer.findUnique({
        where: {
          gameId_userId: {
            gameId: gameIdNum,
            userId: auth.userId,
          },
        },
        select: { score: true },
      });

      if (!gamePlayer) {
        return NextResponse.json<ApiError>(
          { error: "You must join the game first", code: "NOT_IN_GAME" },
          { status: 403 }
        );
      }

      // Get question details
      const question = await prisma.question.findUnique({
        where: { id: questionId },
        select: { correctIndex: true, durationSec: true, gameId: true },
      });

      if (!question) {
        return NextResponse.json<ApiError>(
          { error: "Question not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      if (question.gameId !== gameIdNum) {
        return NextResponse.json<ApiError>(
          {
            error: "Question does not belong to this game",
            code: "INVALID_QUESTION",
          },
          { status: 400 }
        );
      }

      // Calculate score
      const maxTimeSec = question.durationSec ?? 10;
      const correct = selectedIndex === question.correctIndex;

      // Calculate consecutive correct answers for combo bonus
      const recentAnswers = await prisma.answer.findMany({
        where: {
          userId: auth.userId,
          gameId: gameIdNum,
          questionId: { not: questionId },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { isCorrect: true },
      });

      let consecutiveCorrect = 0;
      for (const ans of recentAnswers) {
        if (ans.isCorrect) consecutiveCorrect++;
        else break;
      }

      const scoreResult = calculateScore({
        timeTakenMs,
        maxTimeSec,
        isCorrect: correct,
        difficulty: QuestionDifficulty.MEDIUM,
        consecutiveCorrect,
      });

      const newPoints = scoreResult.score;
      let totalScore = gamePlayer.score;

      // Use transaction for atomic update
      await prisma.$transaction(async (tx) => {
        // Find previous answer if any
        const previousAnswer = await tx.answer.findUnique({
          where: {
            userId_questionId: { userId: auth.userId, questionId },
          },
          select: { pointsEarned: true },
        });

        const previousPoints = previousAnswer?.pointsEarned ?? 0;

        // Upsert the answer
        await tx.answer.upsert({
          where: {
            userId_questionId: { userId: auth.userId, questionId },
          },
          update: {
            selectedIndex: selectedIndexValue,
            isCorrect: correct,
            latencyMs: timeTakenMs,
            pointsEarned: newPoints,
          },
          create: {
            userId: auth.userId,
            gameId: gameIdNum,
            questionId,
            selectedIndex: selectedIndexValue,
            isCorrect: correct,
            latencyMs: timeTakenMs,
            pointsEarned: newPoints,
          },
        });

        // Update game player score
        const pointsDelta = newPoints - previousPoints;
        totalScore = Math.max(0, gamePlayer.score + pointsDelta);

        await tx.gamePlayer.update({
          where: { gameId_userId: { gameId: gameIdNum, userId: auth.userId } },
          data: { score: totalScore },
        });
      });

      const response: SubmitAnswerResponse = {
        success: true,
        isCorrect: correct,
        pointsEarned: newPoints,
        totalScore,
      };

      return NextResponse.json(response);
    } catch (error: unknown) {
      console.error("POST /api/v1/games/[gameId]/answers Error:", error);

      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        return NextResponse.json<ApiError>(
          {
            error: "A database conflict occurred. Please try again.",
            code: "CONFLICT",
          },
          { status: 409 }
        );
      }

      return NextResponse.json<ApiError>(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  }
);
