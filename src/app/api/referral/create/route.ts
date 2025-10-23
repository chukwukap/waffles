// ───────────────────────── src/app/api/referral/create/route.ts ─────────────────────────
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Generate a code using modern crypto
function generateCode(length = 6) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint8Array(length);
  // Use crypto.getRandomValues for secure randomness
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return code;
}

const bodySchema = z.object({
  inviterId: z.number().int().positive(), // User.id of inviter
  fid: z.number().int().positive().optional(), // Farcaster ID of inviter (legacy, optional)
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    // Accept either { inviterId } or legacy { fid }
    let inviter;
    let inviterId: number | undefined;

    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (typeof parsed.data.inviterId === "number") {
      inviterId = parsed.data.inviterId;
      inviter = await prisma.user.findUnique({ where: { id: inviterId } });
    } else if (typeof parsed.data.fid === "number") {
      // Find user by Farcaster ID (string in Prisma schema)
      inviter = await prisma.user.findUnique({
        where: { farcasterId: parsed.data.fid.toString() },
      });
      inviterId = inviter?.id;
    }

    if (!inviter || typeof inviterId !== "number") {
      return NextResponse.json({ error: "Inviter not found" }, { status: 404 });
    }

    // 2️⃣ Check if inviter already has a code
    const existing = await prisma.referral.findFirst({
      where: { inviterId },
      orderBy: { createdAt: "asc" },
    });
    if (existing)
      return NextResponse.json({
        code: existing.code,
        inviterId: existing.inviterId,
        inviteeId: existing.inviteeId ?? undefined,
      });

    // 3️⃣ Create a new referral code (safe & unique)
    let code: string;
    let tries = 0;
    while (true) {
      code = generateCode();
      const already = await prisma.referral.findUnique({ where: { code } });
      if (!already) break;
      tries++;
      if (tries > 10) throw new Error("Referral code collision");
    }
    const referral = await prisma.referral.create({
      data: {
        code,
        inviterId,
      },
    });

    return NextResponse.json({
      code: referral.code,
      inviterId: referral.inviterId,
      inviteeId: referral.inviteeId ?? undefined,
    });
  } catch (err) {
    console.error("[REFERRAL_CREATE_ERROR]", err);
    return NextResponse.json(
      { error: "Failed to create referral code" },
      { status: 500 }
    );
  }
}
