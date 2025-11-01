import { z } from "zod";
import { prisma } from "@/lib/db";
import { ChatWithUser as ChatWithUserType } from "@/state/types";
import { NextRequest, NextResponse } from "next/server";

// Schema for query parameter validation
const querySchema = z.object({
  gameId: z.number().int().positive("Invalid gameId format"), // Validate and transform to number
});

// ====================================================================
// GET /api/chat - Fetch chat messages for a specific game
// ====================================================================
export async function GET(request: NextRequest) {
  // Use NextRequest
  try {
    const { searchParams } = new URL(request.url);
    const gameIdParam = searchParams.get("gameId");

    const validationResult = querySchema.safeParse({ gameId: gameIdParam });
    if (!validationResult.success) {
      const firstError =
        validationResult.error.message || "Invalid or missing gameId";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }
    const { gameId } = validationResult.data;

    // Optional: Add pagination or limit? For now, fetch all.
    // const limit = 50; // Example limit
    // const cursor = searchParams.get("cursor"); // Example cursor

    // 2. Fetch Messages
    const messages = await prisma.chat.findMany({
      where: { gameId },
      include: {
        user: {
          select: { name: true, imageUrl: true, id: true, fid: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const formattedMessages: ChatWithUserType[] = messages.map((msg) => ({
      id: msg.id,
      gameId: msg.gameId,
      userId: msg.userId,
      user: {
        id: msg.user?.id ?? 0,
        fid: msg.user?.fid ?? null,
        name: msg.user?.name ?? "anon",
        imageUrl: msg.user?.imageUrl ?? null,
      },
      message: msg.message,
      createdAt: msg.createdAt,
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    // Catch unexpected errors
    console.error("GET /api/chat Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
