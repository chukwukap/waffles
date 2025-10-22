import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";

// GET /api/profile
export async function GET(request: Request) {
  const farcasterId = request.headers.get("x-farcaster-id");
  if (!farcasterId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { farcasterId },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const { id, name, wallet, imageUrl } = user;
  return NextResponse.json({ id, name, wallet, imageUrl });
}

// PUT /api/profile
export async function PUT(request: Request) {
  const schema = z.object({
    name: z.string().optional(),
    wallet: z.string().optional(),
    imageUrl: z.string().url().optional(),
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
  const { name, wallet, imageUrl } = parseResult.data;
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
    data: {
      name: name !== undefined ? name : user.name,
      wallet: wallet !== undefined ? wallet : user.wallet,
      imageUrl: imageUrl !== undefined ? imageUrl : user.imageUrl,
    },
  });
  const {
    id,
    name: newName,
    wallet: newWallet,
    imageUrl: newImageUrl,
  } = updated;
  return NextResponse.json({
    id,
    name: newName,
    wallet: newWallet,
    imageUrl: newImageUrl,
  });
}
