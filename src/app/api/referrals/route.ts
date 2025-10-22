import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

// GET /api/referrals
export async function GET(request: Request) {
  const farcasterId = request.headers.get("x-farcaster-id");
  if (!farcasterId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { farcasterId },
    include: { referrals: { include: { invitee: true } } },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const referrals =
    user.referrals.map((ref) => ({
      inviteeId: ref.invitee?.id,
      inviteeFarcasterId: ref.invitee?.farcasterId,
    })) ?? [];
  return NextResponse.json({ referrals });
}

// POST /api/referrals
export async function POST(request: Request) {
  const schema = z.object({
    code: z.string().min(1),
  });
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { valid: false, message: "Invalid JSON" },
      { status: 400 }
    );
  }
  const parseResult = schema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { valid: false, message: "Invalid input" },
      { status: 400 }
    );
  }
  const { code } = parseResult.data;
  const farcasterId = request.headers.get("x-farcaster-id");
  if (!farcasterId) {
    return NextResponse.json(
      { valid: false, message: "Unauthorized" },
      { status: 401 }
    );
  }
  const user = await prisma.user.findUnique({ where: { farcasterId } });
  if (!user) {
    return NextResponse.json(
      { valid: false, message: "User not found" },
      { status: 404 }
    );
  }
  const inviter = await prisma.user.findUnique({
    where: { referralCode: code },
  });
  if (!inviter) {
    return NextResponse.json(
      { valid: false, message: "Invite code not found" },
      { status: 400 }
    );
  }
  if (inviter.id === user.id) {
    return NextResponse.json(
      { valid: false, message: "Cannot use your own invite code" },
      { status: 400 }
    );
  }
  const existing = await prisma.referral.findFirst({
    where: { inviterId: inviter.id, inviteeId: user.id },
  });
  if (existing) {
    return NextResponse.json(
      { valid: false, message: "Referral already recorded" },
      { status: 400 }
    );
  }
  await prisma.referral.create({
    data: { code, inviterId: inviter.id, inviteeId: user.id },
  });
  return NextResponse.json({ valid: true });
}
