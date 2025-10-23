// ───────────────────────── src/app/api/referral/create/route.ts ─────────────────────────
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Accepts: { inviterId: number }
const bodySchema = z.object({
  inviterId: z.number().int().positive(), // User *ID* of inviter, matches schema.prisma
});

// Fast, simple uppercase 4-char A-Z0-9 code generation using crypto
function generateReferralCode(length = 4) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  let code = "";
  for (let i = 0; i < length; ++i) {
    code += chars.charAt(arr[i] % chars.length);
  }
  return code;
}

// POST /api/referral/create
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { inviterId } = bodySchema.parse(json);

    // 1️⃣ Find user by primary id
    const inviter = await prisma.user.findUnique({ where: { id: inviterId } });
    if (!inviter) {
      return NextResponse.json({ error: "Inviter not found" }, { status: 404 });
    }

    // 2️⃣ Check if inviter already has a code
    const existing = await prisma.referral.findFirst({
      where: { inviterId: inviter.id },
    });
    if (existing) return NextResponse.json(existing);

    // 3️⃣ Create a new, unique referral code
    let code: string;
    let codeExists = true;
    do {
      code = generateReferralCode();
      const check = await prisma.referral.findUnique({ where: { code } });
      codeExists = !!check;
    } while (codeExists);

    const referral = await prisma.referral.create({
      data: {
        code,
        inviterId: inviter.id,
      },
    });

    return NextResponse.json(referral);
  } catch (err) {
    console.error("[REFERRAL_CREATE_ERROR]", err);
    return NextResponse.json(
      { error: "Failed to create referral code" },
      { status: 500 }
    );
  }
}
