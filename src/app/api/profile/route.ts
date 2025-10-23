// ───────────────────────── /app/api/profile/route.ts ─────────────────────────
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

// GET /api/profile
export async function GET(request: Request) {
  const farcasterId = request.headers.get("x-farcaster-id");
  if (!farcasterId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { farcasterId },
    select: { id: true, name: true, wallet: true, imageUrl: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// PUT /api/profile
export async function PUT(request: Request) {
  const schema = z.object({
    name: z.string().trim().optional(),
    wallet: z.string().trim().optional(),
    imageUrl: z.string().url().optional(),
  });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const farcasterId = request.headers.get("x-farcaster-id");
  if (!farcasterId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { farcasterId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
    select: { id: true, name: true, wallet: true, imageUrl: true },
  });

  return NextResponse.json(updated);
}
