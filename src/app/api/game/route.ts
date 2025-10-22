import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

// GET /api/games
export async function GET() {
  const games = await prisma.game.findMany({
    orderBy: { startTime: "asc" },
  });
  return NextResponse.json(games);
}

// POST /api/games
export async function POST(request: Request) {
  const schema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    startTime: z.string(),
    endTime: z.string(),
  });
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parseResult = schema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { title, description, startTime, endTime } = parseResult.data;
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }
  if (start >= end) {
    return NextResponse.json(
      { error: "startTime must be before endTime" },
      { status: 400 }
    );
  }
  const game = await prisma.game.create({
    data: {
      title,
      description,
      startTime: start,
      endTime: end,
    },
  });
  return NextResponse.json(game);
}
