import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const querySchema = z.object({
  fid: z.string().regex(/^\d+$/, "FID must be a numeric string."),
});

/**
 * GET handler to check if a user (identified by FID query param) has a
 * referral record indicating they were invited.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fidParam = searchParams.get("fid");

    const validationResult = querySchema.safeParse({ fid: fidParam });
    if (!validationResult.success) {
      const firstError =
        validationResult.error.message || "Invalid or missing FID";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }
    const { fid } = validationResult.data;

    const user = await prisma.user.findUnique({
      where: { fid: Number(fid) },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({
        hasInvite: false,
        message: "User not found.",
      });
    }

    const referral = await prisma.referral.findFirst({
      where: { inviteeId: user.id },
      select: {
        code: true,
        acceptedAt: true,
      },
    });

    if (!referral) {
      return NextResponse.json({ hasInvite: false });
    }

    return NextResponse.json({
      hasInvite: true,
      referral: {
        code: referral.code,
        acceptedAt: referral.acceptedAt,
      },
    });
  } catch (error) {
    console.error("Failed to fetch referral status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Ensure dynamic execution for fresh referral status data
export const dynamic = "force-dynamic";
