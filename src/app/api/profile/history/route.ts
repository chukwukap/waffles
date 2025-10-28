import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { GameHistoryEntry } from "@/state/types";

export async function GET(request: NextRequest) {
  try {
    const farcasterId = request.headers.get("x-farcaster-id");
    if (!farcasterId || !/^\d+$/.test(farcasterId)) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing Farcaster ID header" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(farcasterId) },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const scores = await prisma.score.findMany({
      where: { userId: user.id },
      include: {
        game: {
          select: { id: true, name: true },
        },
      },
      orderBy: { game: { endTime: "desc" } }, // Order by game end time, latest first [cite: 1007]
      // Optional: Add pagination here if history can become very large
      // take: 50,
      // skip: page * 50,
    });

    // 4. Format Response Data
    // Map Prisma result to the GameHistory type expected by the client
    const history: GameHistoryEntry[] = scores.map((s) => ({
      //
      id: s.game.id, // Use game ID as the history item ID
      name: s.game.name ?? "Unnamed Game", // Use game name, provide fallback
      score: s.points, // Score points
      // TODO: Determine actual winnings - is it just points or calculated differently?
      // Assuming winnings are based on points for now, needs clarification.
      winnings: s.points, // Use points as winnings placeholder
      winningsColor: s.points > 0 ? "green" : "gray", // Determine color based on points
    }));

    return NextResponse.json(history); // Return the formatted history array [cite: 1009]
  } catch (error) {
    // Catch unexpected errors
    console.error("GET /api/profile/history Error:", error); // Log server-side
    return NextResponse.json(
      //
      { error: "Internal Server Error" }, // Generic error
      { status: 500 } //
    );
  }
}

// Ensure dynamic execution for fetching potentially updated history
export const dynamic = "force-dynamic"; //
