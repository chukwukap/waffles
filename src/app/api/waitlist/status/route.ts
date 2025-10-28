import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Define a schema for the query parameters
const querySchema = z.object({
  fid: z.string().regex(/^\d+$/, "FID must be a numeric string."),
});

/**
 * GET handler to check a user's waitlist status, rank, and invite count.
 * Expects 'fid' as a query parameter.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fidParam = searchParams.get("fid");

    const validationResult = querySchema.safeParse({ fid: fidParam });

    if (!validationResult.success) {
      const firstError =
        validationResult.error.message || "Invalid FID parameter";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { fid } = validationResult.data;

    const user = await prisma.user.findUnique({ where: { fid: Number(fid) } });
    if (!user) {
      return NextResponse.json({ onList: false });
    }

    const entry = await prisma.waitlist.findUnique({
      where: { userId: user.id },
    });
    if (!entry) {
      return NextResponse.json({ onList: false });
    }

    // Calculate rank using a raw SQL query
    // The query orders users by their signup time, adjusted earlier by invite count.
    // ROW_NUMBER() assigns rank based on this order.
    // NOTE: Performance might degrade with very large waitlists. Consider indexing createdAt.
    const rankResult = await prisma.$queryRaw<{ rank: bigint }[]>`
      SELECT rank FROM (
        SELECT
          id,
          ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, id ASC) as rank
          -- Original rank calculation (adjusting time based on invites):
          -- ROW_NUMBER() OVER (ORDER BY ("createdAt" - (invites * INTERVAL '2 minutes')) ASC, id ASC) as rank
        FROM "Waitlist"
      ) t
      WHERE t.id = ${entry.id}
    `;

    const rank = rankResult[0]?.rank ? Number(rankResult[0].rank) : null;

    return NextResponse.json({
      onList: true,
      rank: rank,
      invites: entry.invites,
    });
  } catch (error) {
    console.error("Error fetching waitlist status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Ensure this route is always dynamically evaluated, preventing stale cached responses.
export const dynamic = "force-dynamic";
