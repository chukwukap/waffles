import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchActiveGame } from "@/lib/server/game";

export async function POST(request: Request) {
  try {
    const { farcasterId, gameId } = await request.json();
    if (!farcasterId) {
      return NextResponse.json(
        { error: "Missing farcasterId" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { farcasterId: String(farcasterId) },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let targetGameId: number | null = Number.isFinite(gameId)
      ? Number(gameId)
      : null;

    if (!targetGameId) {
      const activeGame = await fetchActiveGame();
      targetGameId = activeGame?.id ?? null;
    }

    if (!targetGameId) {
      return NextResponse.json(
        { error: "No game identified" },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: {
        gameId_userId: {
          gameId: targetGameId,
          userId: user.id,
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found for this game" },
        { status: 404 }
      );
    }

    if (ticket.usedAt) {
      return NextResponse.json({
        success: true,
        ticketId: ticket.id,
        usedAt: ticket.usedAt,
        status: ticket.status,
      });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        usedAt: new Date(),
        status: ticket.status === "pending" ? "completed" : ticket.status,
      },
    });

    return NextResponse.json({
      success: true,
      ticketId: updated.id,
      usedAt: updated.usedAt,
      status: updated.status,
    });
  } catch (error) {
    console.error("Failed to complete game", error);
    return NextResponse.json(
      { error: "Failed to mark completion" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
