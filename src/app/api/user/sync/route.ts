import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { randomBytes } from "crypto";

const schema = z.object({
  fid: z.number(),
  username: z.string().optional(),
  pfpUrl: z.string().url().optional(),
  wallet: z.string().optional(),
});

const REFERRAL_CODE_LENGTH = 6;

function generateReferralCode(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = randomBytes(REFERRAL_CODE_LENGTH);
  let code = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return code;
}

async function ensureReferral(inviterId: number) {
  const existing = await prisma.referral.findFirst({
    where: { inviterId },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  // Generate a unique code – retry a few times to avoid collisions
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateReferralCode();
    try {
      return await prisma.referral.create({
        data: {
          code,
          inviterId,
        },
      });
    } catch (err) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        err.code === "P2002"
      ) {
        continue; // collision, try again
      }
      throw err;
    }
  }

  throw new Error("Failed to generate referral code");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const user = await prisma.user.upsert({
      where: { farcasterId: String(data.fid) },
      update: {
        name: data.username ?? undefined,
        imageUrl: data.pfpUrl ?? undefined,
        wallet: data.wallet ?? undefined,
      },
      create: {
        farcasterId: String(data.fid),
        name: data.username ?? null,
        imageUrl: data.pfpUrl ?? null,
        wallet: data.wallet ?? null,
      },
    });

    const referral = await ensureReferral(user.id);

    return NextResponse.json({
      success: true,
      user,
      referralCode: referral.code,
    });
  } catch (err) {
    console.error("User sync failed", err);
    return NextResponse.json(
      {
        success: false,
        error: "User sync failed",
      },
      { status: 500 }
    );
  }
}
