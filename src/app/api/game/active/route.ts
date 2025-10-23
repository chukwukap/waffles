import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const game = await prisma.game.findFirst({
    where: { endTime: null },
    include: { config: true, questions: true },
    orderBy: { createdAt: "desc" },
  });

  if (!game) {
    return NextResponse.json({ error: "No active game" }, { status: 404 });
  }

  return NextResponse.json(game);
}
