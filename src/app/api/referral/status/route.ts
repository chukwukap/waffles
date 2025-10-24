import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fidParam = searchParams.get("fid");
    if (!fidParam) {
      return NextResponse.json({ error: "Missing fid" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { farcasterId: String(fidParam) },
    });

    if (!user) {
      return NextResponse.json({ hasInvite: false });
    }

    const referral = await prisma.referral.findFirst({
      where: { inviteeId: user.id },
      include: {
        inviter: {
          select: { farcasterId: true, name: true },
        },
      },
    });

    if (!referral) {
      return NextResponse.json({ hasInvite: false });
    }

    return NextResponse.json({
      hasInvite: true,
      referral: {
        code: referral.code,
        inviterFarcasterId: referral.inviter?.farcasterId ?? "",
        inviteeId: referral.inviteeId ?? undefined,
        acceptedAt: referral.acceptedAt,
      },
    });
  } catch (error) {
    console.error("Failed to fetch referral status", error);
    return NextResponse.json(
      { error: "Failed to fetch referral status" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
