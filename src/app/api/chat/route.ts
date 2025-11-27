import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const gameId = searchParams.get("gameId");
  const limit = parseInt(searchParams.get("limit") || "50");

  if (!gameId) {
    return NextResponse.json({ error: "Game ID is required" }, { status: 400 });
  }

  try {
    const messages = await prisma.chat.findMany({
      where: {
        gameId: parseInt(gameId),
      },
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            pfpUrl: true,
          },
        },
      },
    });

    // Reverse to show oldest first (chronological order) if needed,
    // but usually chat feeds want newest at the bottom.
    // The component seems to handle "newest last" logic by appending.
    // So we should return them in chronological order (oldest to newest).
    return NextResponse.json({ messages: messages.reverse() });
  } catch (error) {
    console.error("Failed to fetch chat messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
