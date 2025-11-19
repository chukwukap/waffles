import { z } from "zod";
import { prisma } from "@/lib/db";
import { ChatWithUser as ChatWithUserType } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

// Schema for query parameter validation
const querySchema = z.object({
  gameId: z.coerce.number().int().positive("Invalid gameId format"), // Use coerce
});

// ====================================================================
// GET /api/chat - Fetch chat messages for a specific game
// ====================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameIdParam = searchParams.get("gameId");

    const validationResult = querySchema.safeParse({ gameId: gameIdParam });
    if (!validationResult.success) {
      const firstError =
        validationResult.error.issues[0]?.message ||
        "Invalid or missing gameId";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }
    const { gameId } = validationResult.data;

    // 2. Fetch Messages
    const messages = await prisma.chat.findMany({
      where: { gameId },
      include: {
        user: {
          select: {
            id: true,
            fid: true,
            username: true, // CHANGED
            pfpUrl: true, // CHANGED
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // 3. Format Messages
    // This type maps directly to the ChatWithUserType in lib/types.ts
    const formattedMessages: ChatWithUserType[] = messages.map((msg) => ({
      id: msg.id,
      gameId: msg.gameId,
      userId: msg.userId,
      text: msg.text, // CHANGED
      createdAt: msg.createdAt,
      user: {
        id: msg.user?.id ?? 0,
        fid: msg.user?.fid ?? 0,
        username: msg.user?.username ?? "anon", // CHANGED
        pfpUrl: msg.user?.pfpUrl ?? null, // CHANGED
      },
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
