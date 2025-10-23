import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { type Prisma } from "@prisma/client";

// Define enum and config schema as before
const prizePoolTypeEnum = z.enum(["FIXED", "DYNAMIC"]);

const baseConfigSchema = z.object({
  roundTimeLimit: z.number().int().positive().max(3600).optional(),
  questionsPerGame: z.number().int().positive().max(200).optional(),
  scoreMultiplier: z.number().positive().max(100).optional(),
  scorePenalty: z.number().min(-1000).max(0).nullable().optional(),
  maxPlayers: z.number().int().positive().max(100000).optional(),
  soundEnabled: z.boolean().optional(),
  animationEnabled: z.boolean().optional(),
  prizePoolType: prizePoolTypeEnum.optional(),
  prizePoolFixedAmount: z.number().int().nonnegative().nullable().optional(),
  prizePoolDynamicTickets: z.number().int().nonnegative().nullable().optional(),
  timeBonusEnabled: z.boolean().optional(),
  difficultyScaling: z.number().positive().max(10).optional(),
});

// Helper: authorization for PUT (admins only)
function isAuthorizedAdmin(request: NextRequest): boolean {
  const headerToken = request.headers.get("x-admin-token");
  const envToken = process.env.ADMIN_TOKEN;
  return Boolean(envToken && headerToken && headerToken === envToken);
}

// --- TYPE FIX: Next.js expects "params" to be a Promise in context ---
// See type error in build output (params: Promise<{ gameId: string; }>;)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ gameId: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const gameId = Number(resolvedParams.gameId);
    if (!Number.isInteger(gameId)) {
      return NextResponse.json({ error: "Invalid gameId" }, { status: 400 });
    }

    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const config = await prisma.gameConfig.findUnique({ where: { gameId } });
    return NextResponse.json(config ?? null);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ gameId: string }> }
) {
  try {
    if (!isAuthorizedAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const gameId = Number(resolvedParams.gameId);
    if (!Number.isInteger(gameId)) {
      return NextResponse.json({ error: "Invalid gameId" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = baseConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const existing = await prisma.gameConfig.findUnique({ where: { gameId } });
    const data = {
      ...parsed.data,
      gameId,
    } as Prisma.GameConfigUncheckedUpdateInput;
    let updated;
    if (!existing) {
      updated = await prisma.gameConfig.create({
        data: data as Prisma.GameConfigCreateInput,
      });
    } else {
      updated = await prisma.gameConfig.update({ where: { gameId }, data });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
