import { NextRequest, NextResponse } from "next/server";
import { prisma, UserStatus } from "@/lib/db";
import { z } from "zod";

// Query parameter validation schema (still valid)
const querySchema = z.object({
  fid: z
    .string()
    .regex(/^\d+$/, "FID must be a numeric string")
    .transform(Number),
});

export interface WaitlistData {
  onList: boolean;
  rank: number | null;
  invites: number;
  completedTasks: string[];
  status: UserStatus;
}

/**
 * GET /api/waitlist?fid=<fid>
 * Fetches waitlist data for a given user FID using the new User schema
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fidParam = searchParams.get("fid");

    // Validate query parameters
    const validationResult = querySchema.safeParse({ fid: fidParam });
    if (!validationResult.success) {
      const firstError =
        validationResult.error.message || "Invalid or missing fid";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { fid } = validationResult.data;

    // Fetch all user data in one query
    const user = await prisma.user.findUnique({
      where: { fid },
      select: {
        id: true,
        fid: true,
        status: true,
        completedTasks: true,
        waitlistPoints: true,
      },
    });

    if (!user) {
      // Return default "not on list" data if user not found
      return NextResponse.json<WaitlistData>({
        onList: false,
        rank: null,
        invites: 0,
        completedTasks: [],
        status: "NONE",
      });
    }

    const onList = user.status === "WAITLIST" || user.status === "ACTIVE";

    // Calculate rank and invites in parallel (only if on waitlist)
    const [rank, invites] = await Promise.all([
      onList
        ? prisma.user
            .count({
              where: {
                status: { in: ["WAITLIST", "ACTIVE"] },
                waitlistPoints: { gt: user.waitlistPoints },
              },
            })
            .then((count) => count + 1) // Convert to 1-based rank
        : Promise.resolve(null),
      prisma.referralReward.count({
        where: { inviterId: user.id },
      }),
    ]);

    // Return waitlist data
    const waitlistData: WaitlistData = {
      onList,
      rank,
      invites,
      completedTasks: user.completedTasks,
      status: user.status,
    };

    return NextResponse.json(waitlistData);
  } catch (error) {
    console.error("GET /api/waitlist Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
