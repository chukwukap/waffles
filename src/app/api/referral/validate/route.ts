// ───────────────────────── src/app/api/referral/validate/route.ts ─────────────────────────
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Accept referral code, and invitee's Farcaster ID (fid)
const bodySchema = z.object({
  code: z.string().length(4),
  fid: z.number().int().positive(), // invitee’s Farcaster ID
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { code, fid } = bodySchema.parse(json);

    // 1️⃣ Find invitee by fid (prisma schema: farcasterId is string)
    const invitee = await prisma.user.findUnique({
      where: { farcasterId: String(fid) },
    });
    if (!invitee) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invitee not found. Complete onboarding first.",
        },
        { status: 404 }
      );
    }

    // 2️⃣ Find the referral code (on "referral" table, column: code)
    const referral = await prisma.referral.findUnique({
      where: { code },
    });
    if (!referral) {
      return NextResponse.json(
        { valid: false, error: "Invalid code" },
        { status: 404 }
      );
    }

    // 3️⃣ Prevent self-referral (can't use your own code)
    if (referral.inviterId === invitee.id) {
      return NextResponse.json(
        { valid: false, error: "Cannot use your own code" },
        { status: 400 }
      );
    }

    // 4️⃣ Prevent duplicate referrals (same inviter & invitee can't refer more than once)
    const duplicate = await prisma.referral.findFirst({
      where: {
        inviterId: referral.inviterId,
        inviteeId: invitee.id,
      },
    });
    if (duplicate) {
      return NextResponse.json({
        valid: true,
        message: "Already validated",
        inviterId: referral.inviterId,
        inviteeId: invitee.id,
        referral: duplicate,
      });
    }

    // 5️⃣ Set inviteeId on this referral row if not already set (the code is single-use for one invitee)
    // If already set, treat as successful but return that referral row
    if (referral.inviteeId && referral.inviteeId !== invitee.id) {
      // Code already used for another invitee
      return NextResponse.json(
        { valid: false, error: "Code already redeemed by another user." },
        { status: 400 }
      );
    }

    // If this code has not yet been used for an invitee, update the inviteeId column
    let updatedReferral;
    if (!referral.inviteeId) {
      updatedReferral = await prisma.referral.update({
        where: { code },
        data: { inviteeId: invitee.id },
      });
    } else {
      updatedReferral = referral;
    }

    return NextResponse.json({
      valid: true,
      inviterId: referral.inviterId,
      inviteeId: invitee.id,
      referral: updatedReferral,
    });
  } catch (err) {
    console.error("[REFERRAL_VALIDATE_ERROR]", err);
    return NextResponse.json(
      { valid: false, error: "Validation failed" },
      { status: 500 }
    );
  }
}
