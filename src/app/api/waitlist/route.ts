import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Query parameter validation schema
const querySchema = z.object({
  fid: z
    .string()
    .regex(/^\d+$/, "FID must be a numeric string")
    .transform(Number),
});

/**
 * Calculates fair waitlist rank, considering both creation time and invites.
 * A user's rank is determined by their waitlist "score" (more invites = better), then by earliest join.
 * - Score = invites * 10000 - createdAt timestamp (smaller = better)
 * - Higher invites always ranks above, earlier join time breaks ties.
 * Returns 1-based rank (1 = best). Returns null if not on waitlist.
 */
async function getWaitlistRank(fid: number): Promise<number | null> {
  const user = await prisma.user.findUnique({
    where: { fid },
    select: { id: true, fid: true, waitlist: true },
  });

  if (!user || !user.waitlist) {
    return null;
  }

  const waitlistEntry = user.waitlist;
  const userScore =
    (waitlistEntry.invites || 0) * 10000 -
    new Date(waitlistEntry.createdAt).getTime();

  // Find how many waitlist entries have a better (lower) score
  const allEntries = await prisma.waitlist.findMany({
    select: { invites: true, createdAt: true },
  });

  let betterCount = 0;
  for (const entry of allEntries) {
    const entryScore =
      (entry.invites || 0) * 10000 - new Date(entry.createdAt).getTime();
    if (entryScore > userScore) {
      // lower score = better
      continue;
    }
    if (entryScore < userScore) {
      betterCount++;
    }
    // If scores are equal, do not increment (user and entry tie, i.e., the user is only ranked after those clearly better).
  }

  return betterCount + 1; // 1-based rank
}

export interface WaitlistData {
  onList: boolean;
  rank: number | null;
  invites: number;
}

/**
 * GET /api/waitlist?fid=<fid>
 * Fetches waitlist data for a given user FID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fidParam = searchParams.get("fid");

    // Validate query parameters
    const validationResult = querySchema.safeParse({ fid: fidParam });
    if (!validationResult.success) {
      const firstError =
        validationResult.error.errors[0]?.message || "Invalid or missing fid";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { fid } = validationResult.data;

    // Fetch user data
    const user = await prisma.user.findUnique({
      where: { fid },
      select: { id: true, fid: true, waitlist: true },
    });

    if (!user) {
      // Return default "not on list" data if user not found
      return NextResponse.json<WaitlistData>({
        onList: false,
        rank: null,
        invites: 0,
      });
    }

    // Calculate rank
    const rank = await getWaitlistRank(user.fid);

    // Return waitlist data
    const waitlistData: WaitlistData = {
      onList: rank !== null,
      rank,
      invites: user.waitlist?.invites ?? 0,
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

