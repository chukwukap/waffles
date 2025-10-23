// ───────────────────────── src/app/api/referral/validate/route.ts ─────────────────────────
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({
  code: z.string().length(4),
  fid: z.number().int().positive(), // invitee’s Farcaster ID
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { code, fid } = bodySchema.parse(json);

    // 1️⃣ Verify invitee exists
    const invitee = await prisma.user.findUnique({ where: { fid } });
    if (!invitee) {
      // Option A: Reject until user finishes onboarding
      return NextResponse.json(
        { error: "Invitee not found. Complete onboarding first." },
        { status: 404 }
      );
      // Option B: Auto-create minimal user record:
      // const invitee = await prisma.user.create({ data: { fid, username: "anon_" + fid } });
    }

    // 2️⃣ Find the referral code
    const referralCode = await prisma.referralCode.findUnique({
      where: { code },
    });
    if (!referralCode) {
      return NextResponse.json(
        { valid: false, error: "Invalid code" },
        { status: 404 }
      );
    }

    // 3️⃣ Prevent self-referral
    if (referralCode.inviterId === invitee.id) {
      return NextResponse.json(
        { valid: false, error: "Cannot use your own code" },
        { status: 400 }
      );
    }

    // 4️⃣ Prevent duplicate referral between inviter & invitee
    const existingReferral = await prisma.referral.findFirst({
      where: {
        inviterId: referralCode.inviterId,
        inviteeId: invitee.id,
      },
    });
    if (existingReferral) {
      return NextResponse.json({ valid: true, message: "Already validated" });
    }

    // 5️⃣ Record new referral
    const newReferral = await prisma.referral.create({
      data: {
        inviterId: referralCode.inviterId,
        inviteeId: invitee.id,
        code,
      },
    });

    return NextResponse.json({
      valid: true,
      inviterId: referralCode.inviterId,
      inviteeId: invitee.id,
      referral: newReferral,
    });
  } catch (err) {
    console.error("[REFERRAL_VALIDATE_ERROR]", err);
    return NextResponse.json(
      { valid: false, error: "Validation failed" },
      { status: 500 }
    );
  }
}
