import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fid = searchParams.get("fid");

    if (!fid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { fid: parseInt(fid) },
      include: {
        _count: {
          select: {
            invites: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate rank based on points
    const rank = await prisma.user.count({
      where: {
        waitlistPoints: {
          gt: user.waitlistPoints,
        },
      },
    });

    return NextResponse.json({
      ...user,
      rank: rank + 1,
      invitesCount: user._count.invites,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
