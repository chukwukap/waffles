import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

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

function isAuthorizedAdmin(request: Request): boolean {
  const headerToken = request.headers.get("x-admin-token");
  const envToken = process.env.ADMIN_TOKEN;
  return Boolean(envToken && headerToken && headerToken === envToken);
}

export async function GET() {
  try {
    let config = await prisma.globalConfig.findFirst();
    if (!config) {
      // Ensure there is always a global config row
      config = await prisma.globalConfig.create({
        data: {
          roundTimeLimit: 60,
          questionsPerGame: 10,
          scoreMultiplier: 1,
          scorePenalty: null,
          maxPlayers: 1000,
          soundEnabled: true,
          animationEnabled: true,
          prizePoolType: "FIXED",
          prizePoolFixedAmount: null,
          prizePoolDynamicTickets: null,
          timeBonusEnabled: false,
          difficultyScaling: 1,
        },
      });
    }
    return NextResponse.json(config);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    if (!isAuthorizedAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const existing = await prisma.globalConfig.findFirst();
    let updated;
    if (!existing) {
      updated = await prisma.globalConfig.create({ data: parsed.data as any });
    } else {
      updated = await prisma.globalConfig.update({
        where: { id: existing.id },
        data: parsed.data as any,
      });
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
