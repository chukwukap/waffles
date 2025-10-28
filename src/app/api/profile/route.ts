import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET handler to fetch essential profile information for the authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    const farcasterId = request.headers.get("x-farcaster-id");
    if (!farcasterId || !/^\d+$/.test(farcasterId)) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing Farcaster ID header" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { fid: Number(farcasterId) },
      select: {
        id: true,
        name: true,
        wallet: true,
        imageUrl: true,
        fid: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("GET /api/profile Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Ensure dynamic execution for potentially updated profiles
export const dynamic = "force-dynamic";
