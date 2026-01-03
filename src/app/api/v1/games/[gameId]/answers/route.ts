import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma";
import { z } from "zod";
import { getScore } from "@/lib/scoring";

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

interface AnswerEntry {
  selected: number;
  correct: boolean;
  points: number;
  ms: number;
}

/**
 * POST /api/v1/games/[gameId]/answers
 * Submit an answer for a question in the game (auth required)
 */
export const POST = withAuth<Params>(
  async (request, auth: AuthResult, params) => {
    try {
      const gameId = params.gameId;

      if (!gameId) {
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

      // Check if game has ended
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: { endsAt: true },
      });

      if (!game) {
        return NextResponse.json<ApiError>(
          { error: "Game not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      if (new Date() > game.endsAt) {
        return NextResponse.json<ApiError>(
          { error: "Game has ended", code: "GAME_ENDED" },
          { status: 403 }
        );
      }

      // Verify user has a game entry
      const entry = await prisma.gameEntry.findUnique({
        where: {
          gameId_userId: {
            gameId,
            userId: auth.userId,
          },
        },
        select: {
          id: true,
          score: true,
          answered: true,
          answers: true,
          paidAt: true,
        },
      });

      if (!entry) {
        return NextResponse.json<ApiError>(
          { error: "You must have a game entry first", code: "NOT_IN_GAME" },
          { status: 403 }
        );
      }

      if (!entry.paidAt) {
        return NextResponse.json<ApiError>(
          { error: "Payment required to play", code: "PAYMENT_REQUIRED" },
          { status: 403 }
        );
      }

      // Get question details
      const question = await prisma.question.findUnique({
        where: { id: questionId },
        select: {
          correctIndex: true,
          durationSec: true,
          gameId: true,
          points: true,
        },
      });

      if (!question) {
        return NextResponse.json<ApiError>(
          { error: "Question not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      if (question.gameId !== gameId) {
        return NextResponse.json<ApiError>(
          {
            error: "Question does not belong to this game",
            code: "INVALID_QUESTION",
          },
          { status: 400 }
        );
      }

      // Parse existing answers
      const existingAnswers =
        (entry.answers as unknown as Record<string, AnswerEntry>) || {};
      const questionKey = String(questionId);

      // Check if already answered
      if (existingAnswers[questionKey]) {
        // Return existing answer instead of error (idempotent)
        const existing = existingAnswers[questionKey];
        return NextResponse.json<SubmitAnswerResponse>({
          success: true,
          isCorrect: existing.correct,
          pointsEarned: existing.points,
          totalScore: entry.score,
        });
      }

      // Calculate score
      const maxTimeSec = question.durationSec ?? 10;
      const isCorrect = selectedIndexValue === question.correctIndex;

      const pointsEarned = getScore(timeTakenMs, maxTimeSec, isCorrect);
      const newTotalScore = entry.score + pointsEarned;

      // Build new answer entry
      const newAnswer: AnswerEntry = {
        selected: selectedIndexValue,
        correct: isCorrect,
        points: pointsEarned,
        ms: timeTakenMs,
      };

      // Build updated answers object
      const updatedAnswers = {
        ...existingAnswers,
        [questionKey]: newAnswer,
      } as unknown as Prisma.JsonObject;

      // Update entry atomically
      await prisma.gameEntry.update({
        where: { id: entry.id },
        data: {
          answers: updatedAnswers,
          score: newTotalScore,
          answered: entry.answered + 1,
        },
      });

      const response: SubmitAnswerResponse = {
        success: true,
        isCorrect,
        pointsEarned,
        totalScore: newTotalScore,
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
