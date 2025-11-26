import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Query parameter validation schema (still valid)
const querySchema = z.object({
  fid: z
    .string()
    .regex(/^\d+$/, "FID must be a numeric string")
    .transform(Number),
});

/**
 * Calculates fair waitlist rank, considering both invites and creation time.
 * A user's rank is determined by their "score".
 * - Score = inviteQuota * 1_000_000_000 - createdAt timestamp (higher score is better)
 * - Higher invite quota always ranks above, earlier join time breaks ties.
 * Returns 1-based rank (1 = best). Returns null if not on waitlist.
 */
async function getWaitlistRank(fid: number): Promise<number | null> {
  const user = await prisma.user.findUnique({
    where: { fid },
    select: { id: true, status: true, inviteQuota: true, createdAt: true },
  });

  // Not on waitlist or not a user
  if (!user || (user.status !== "WAITLIST" && user.status !== "ACTIVE")) {
    return null;
  }

  // Calculate the user's score
  const userScore =
    user.inviteQuota * 1_000_000_000 - new Date(user.createdAt).getTime();

  // Find how many waitlist entries have a better (higher) score
  const allEntries = await prisma.user.findMany({
    where: { status: { in: ["WAITLIST", "ACTIVE"] } },
    select: { inviteQuota: true, createdAt: true },
  });

  let betterCount = 0;
  for (const entry of allEntries) {
    const entryScore =
      entry.inviteQuota * 1_000_000_000 - new Date(entry.createdAt).getTime();

    if (entryScore > userScore) {
      betterCount++;
    }
  }

  return betterCount + 1; // 1-based rank
}

export interface WaitlistData {
  onList: boolean;
  rank: number | null;
  invites: number;
  completedTasks: string[];
  status: string;
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

    // Fetch user data
    const user = await prisma.user.findUnique({
      where: { fid },
      select: { id: true, fid: true, status: true, completedTasks: true },
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

    // Calculate rank and invites in parallel
    const [rank, invites] = await Promise.all([
      getWaitlistRank(user.fid),
      prisma.referralReward.count({
        where: { inviterId: user.id },
      }),
    ]);

    // Return waitlist data
    const waitlistData: WaitlistData = {
      onList: user.status === "WAITLIST" || user.status === "ACTIVE",
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
